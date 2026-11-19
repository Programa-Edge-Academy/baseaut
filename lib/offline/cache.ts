import AsyncStorage from "@react-native-async-storage/async-storage";
import { isNetworkError } from "./errors";
import { isOnline } from "./require-online";

const PREFIX = "baseaut:cache:v1:";

/** Options for {@link cachedRead}. */
export type CachedReadOptions<T> = {
  /**
   * Return the saved copy at once, when there is one, and refresh it in the
   * background. Use it for lists that only need to be fresh eventually (team,
   * children, circuits, exercises, form templates); leave it off for data that
   * is about to be edited, such as saved form answers.
   */
  cacheFirst?: boolean;
  /** Called with the fresh result when a background refresh succeeds. */
  onUpdate?: (value: T) => void;
  /**
   * When a saved copy exists, the longest to wait for the network before
   * returning it; the read keeps running and refreshes the copy. For reads
   * that should be fresh but must not keep the user waiting.
   */
  maxWaitMs?: number;
};

/**
 * Runs a read and keeps its last good result on the device, so the screens a
 * session needs still load offline.
 *
 * @remarks
 * When NetInfo reports no connection and a saved copy exists, the copy is
 * returned without touching the network, so an offline screen does not wait
 * for a request to fail. With `cacheFirst`, the copy is also returned at once
 * while online and the read runs in the background ({@link CachedReadOptions}).
 * Otherwise the read runs first; on a network failure (including the request
 * timeout set in `lib/supabase.ts`) the saved copy is returned instead, and
 * `maxWaitMs` caps how long that wait can be. Any other error is thrown as
 * before, and so is a network failure with nothing saved yet; offline with
 * nothing saved, the read is not even attempted. `fetcher` must throw on error (supabase-js returns errors instead
 * of throwing).
 *
 * @param key - Unique per query and per user or team, e.g. `alunos:<teamId>`.
 */
export async function cachedRead<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CachedReadOptions<T> = {},
): Promise<T> {
  const [cached, online] = await Promise.all([readCache<T>(key), isOnline()]);

  // A saved null (e.g. no team yet) is served first only offline, so a change
  // such as being approved into a team shows up on the next online read.
  if (cached !== undefined && (!online || (options.cacheFirst && cached !== null))) {
    if (online) {
      void fetchAndStore(key, fetcher)
        .then((value) => options.onUpdate?.(value))
        .catch(() => {});
    }
    return cached;
  }

  // Offline with nothing saved: the read would only fail, and slowly if the
  // login token needs renewing, so fail at once as a network error.
  if (!online) throw new TypeError("Network request failed (offline)");

  const request = fetchAndStore(key, fetcher);
  if (cached !== undefined && options.maxWaitMs !== undefined) {
    request.then((value) => options.onUpdate?.(value)).catch(() => {});
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fallback = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(cached), options.maxWaitMs);
    });
    try {
      return await Promise.race([request, fallback]);
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      return cached;
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    return await request;
  } catch (err) {
    if (!isNetworkError(err) || cached === undefined) throw err;
    return cached;
  }
}

async function fetchAndStore<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const value = await fetcher();
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
  return value;
}

/** Stores `value` under `key` as if a read had just returned it. */
export async function primeCache<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

/** The saved copy for `key`, or undefined when there is none. */
export async function readCache<T>(key: string): Promise<T | undefined> {
  const raw = await AsyncStorage.getItem(PREFIX + key).catch(() => null);
  return raw == null ? undefined : (JSON.parse(raw) as T);
}

export async function clearCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + key).catch(() => {});
}
