/**
 * Tells whether an error came from the network rather than from the database.
 *
 * supabase-js does not throw on a failed fetch: it returns an error object
 * with an empty `code` and the fetch failure in `details` or `message`
 * ("TypeError: Network request failed" on Android, "Failed to fetch" on web).
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { message?: string; details?: string };
  const text = `${e.message ?? ""} ${e.details ?? ""} ${String(err)}`;
  return /Network request failed|Failed to fetch|fetch failed|Load failed|NetworkError/i.test(text);
}