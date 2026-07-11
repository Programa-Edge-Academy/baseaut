import { createSessionFromUrl } from "@/features/auth/hooks/use-google-auth";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";

/** State of the recovery session backing the reset-password screen. */
export type RecoverySessionStatus = "checking" | "ready" | "invalid";

/**
 * How long to wait for a deep link before falling back to "invalid". Generous so
 * a slow cold start (bundle load + deep-link delivery) never trips a false
 * negative; the happy path resolves in well under a second.
 */
const DEEP_LINK_TIMEOUT_MS = 8000;

/**
 * Reads an explicit auth error carried back on the recovery redirect. Supabase
 * appends `error`/`error_code`/`error_description` (in the fragment or the
 * query) when the one-time token is already consumed or expired — which is what
 * happens when a mail client's link scanner pre-fetches the link before the user
 * taps it. Returns the human-readable reason, or `null` when there is none.
 */
function extractAuthError(url: string): string | null {
  const segments = [url.split("#")[1], url.split("?")[1]?.split("#")[0]];
  for (const segment of segments) {
    if (!segment) continue;
    const params = new URLSearchParams(segment);
    const code = params.get("error_code") ?? params.get("error");
    if (code) return params.get("error_description") ?? code;
  }
  return null;
}

/**
 * Ensures a recovery session is available before the reset-password form is
 * shown. The session is either already present (code modality, applied by
 * `verify-recovery-code`) or established from the recovery deep link
 * (`baseaut://reset-password#...`) that opens the app on this route.
 *
 * @returns `"checking"` while resolving, `"ready"` once a session exists, or
 * `"invalid"` when no session could be established.
 *
 * @remarks
 * Diagnostics are logged (via `console.warn`) whenever a link fails to yield a
 * session, so a false "invalid" can be told apart from a genuinely
 * consumed/expired link.
 */
export function useRecoverySession(): RecoverySessionStatus {
  const [status, setStatus] = useState<RecoverySessionStatus>("checking");
  const url = Linking.useURL();
  const resolved = useRef(false);
  const consumedUrl = useRef(false);

  useEffect(() => {
    let cancelled = false;

    /** Commits a terminal status once; later effect runs cannot override it. */
    const finalize = (next: RecoverySessionStatus) => {
      if (cancelled || resolved.current) return;
      resolved.current = true;
      setStatus(next);
    };

    const establish = async () => {
      // Already signed in with a recovery session (code modality path).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        finalize("ready");
        return;
      }

      const incoming = url ?? (await Linking.getInitialURL());
      // No deep link yet: keep waiting; the effect re-runs when `url` arrives.
      if (!incoming || consumedUrl.current) return;
      consumedUrl.current = true;

      // The redirect came back with an explicit auth error (e.g. the link was
      // already consumed/expired) — no tokens to work with.
      const authError = extractAuthError(incoming);
      if (authError) {
        console.warn("[recovery] link returned an error:", authError);
        finalize("invalid");
        return;
      }

      try {
        await createSessionFromUrl(incoming);
      } catch (err) {
        console.warn("[recovery] could not establish a session from the link:", err);
      }

      const {
        data: { session: established },
      } = await supabase.auth.getSession();
      if (!established) {
        console.warn(
          "[recovery] the recovery link carried no usable session tokens.",
        );
      }
      finalize(established ? "ready" : "invalid");
    };

    establish();

    // Fallback only: if nothing ever resolved (no link arrived, no session),
    // surface "invalid" so the spinner does not spin forever. Left non-terminal
    // so a late-arriving deep link can still upgrade the screen to "ready".
    const timer = setTimeout(() => {
      if (!cancelled && !resolved.current) setStatus("invalid");
    }, DEEP_LINK_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url]);

  return status;
}
