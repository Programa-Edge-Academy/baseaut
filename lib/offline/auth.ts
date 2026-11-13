import { authStorage, supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { isOnline } from "./require-online";

/**
 * The logged-in user, also when offline with an expired token.
 *
 * @remarks
 * `supabase.auth.getSession()` tries to renew an expired token and, without
 * network, keeps retrying for up to ~25 s and then answers as if nobody were
 * logged in. Offline, the login saved on the device is read directly instead,
 * so the app keeps working and writes go to the outbox under the right user.
 * The saved login is removed by supabase-js on sign-out or when the server
 * rejects the refresh token, so a user who was really signed out is not
 * returned. Only identifies the user locally: anything sent to Supabase still
 * needs a valid token and passes RLS.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (await isOnline()) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session.user;
  }
  return readStoredUser();
}

async function readStoredUser(): Promise<User | null> {
  try {
    const key = (supabase.auth as unknown as { storageKey: string }).storageKey;
    const raw = await authStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { user?: User } | null;
    return stored?.user ?? null;
  } catch {
    return null;
  }
}
