import { createSessionFromUrl } from "@/features/auth/hooks/use-google-auth";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";

/** State of the recovery session backing the reset-password screen. */
export type RecoverySessionStatus = "checking" | "ready" | "invalid";

/** How long to wait for a deep link before concluding the session is missing. */
const DEEP_LINK_TIMEOUT_MS = 4000;

/**
 * Ensures a recovery session is available before the reset-password form is
 * shown. The session is either already present (code modality, applied by
 * `verify-recovery-code`) or established from the recovery deep link
 * (`baseaut://reset-password#...`) that opens the app on this route.
 *
 * @returns `"checking"` while resolving, `"ready"` once a session exists, or
 * `"invalid"` when no session could be established.
 */
export function useRecoverySession(): RecoverySessionStatus {
  const [status, setStatus] = useState<RecoverySessionStatus>("checking");
  const url = Linking.useURL();
  const consumedUrl = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const establish = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        if (!cancelled) setStatus("ready");
        return;
      }

      const incoming = url ?? (await Linking.getInitialURL());
      if (incoming && !consumedUrl.current) {
        consumedUrl.current = true;
        try {
          await createSessionFromUrl(incoming);
        } catch {
          // The URL carried no usable recovery tokens; fall through to the
          // session re-check below.
        }
        const {
          data: { session: established },
        } = await supabase.auth.getSession();
        if (!cancelled) setStatus(established ? "ready" : "invalid");
      }
    };

    establish();

    // Guard against sitting on the spinner forever if no deep link ever arrives.
    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && !session) setStatus("invalid");
    }, DEEP_LINK_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url]);

  return status;
}
