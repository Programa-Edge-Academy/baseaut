import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import NetInfo from "@react-native-community/netinfo";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Copy .env.example to .env and set it's values.",
  );
}

/** Where the login is kept on the device (read offline by `lib/offline/auth.ts`). */
export const authStorage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) =>
          Promise.resolve(
            typeof window === "undefined" ? null : window.localStorage.getItem(key),
          ),
        setItem: (key: string, value: string) => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value);
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
          }
          return Promise.resolve();
        },
      }
    : AsyncStorage;

/** Longest a database or auth request may take before it counts as offline. */
const REQUEST_TIMEOUT_MS = 8000;

/**
 * `fetch` with a time limit for database (`/rest/v1/`) and auth (`/auth/v1/`)
 * requests.
 *
 * @remarks
 * On a weak connection a request can hang for a long time before the system
 * gives up, and every screen that waits on it looks frozen. Past the limit the
 * request is aborted and fails as a network error ("Network request failed"),
 * so `lib/offline` falls back to the saved copy or keeps the write queued.
 * Storage uploads and Edge Functions are left without a limit, since a photo
 * upload can legitimately take longer.
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!/\/(rest|auth)\/v1\//.test(url)) return fetch(input, init);

  const controller = new AbortController();
  const outerSignal = init?.signal;
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener("abort", () => controller.abort());
  }
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal })
    .catch((err) => {
      if (timedOut) throw new TypeError("Network request failed (timeout)");
      throw err;
    })
    .finally(() => clearTimeout(timer));
};

// On web, OAuth providers (Google) redirect back with the session in the URL,
// so detection must be enabled there; on native the session is created
// manually from the auth browser callback.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
  global: { fetch: fetchWithTimeout },
});

/**
 * Token auto-refresh runs only while the app is foregrounded and online.
 *
 * @remarks
 * Offline, a refresh cannot succeed and supabase-js retries it for up to ~25 s,
 * holding every request in the meantime; pausing it keeps the offline screens
 * fast. It resumes as soon as NetInfo reports a connection again.
 */
let appActive = AppState.currentState === "active";
let hasConnection = true;

function syncAutoRefresh() {
  if (appActive && hasConnection) {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
}

AppState.addEventListener("change", (state) => {
  appActive = state === "active";
  syncAutoRefresh();
});

NetInfo.addEventListener((state) => {
  const next = state.isConnected !== false;
  if (next === hasConnection) return;
  hasConnection = next;
  syncAutoRefresh();
});
