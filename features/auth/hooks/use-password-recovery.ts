import { supabase } from "@/lib/supabase";
import { translateAuthError } from "@/features/auth/utils/translate-auth-error";
import { FunctionsHttpError } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { useState } from "react";

/** Shown when the server response carries no readable error detail. */
const genericErrorMessage = "Ocorreu um erro. Tente novamente.";

/**
 * Reads the localized error message returned by the recovery Edge Functions.
 * Edge Functions answer non-2xx responses as a {@link FunctionsHttpError} whose
 * body still holds a `{ error }` field, so it must be parsed from the context.
 */
async function extractFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
    } catch {
    }
  }
  return genericErrorMessage;
}

/** Session tokens returned by `verify-recovery-code` once the code matches. */
type RecoverySession = {
  access_token?: string;
  refresh_token?: string;
};

/**
 * Drives the two password-recovery modalities and the shared reset step:
 *
 * - `sendRecoveryLink` sends the native Supabase recovery e-mail, whose link
 *   deep-links back into the app on `/reset-password` with a live session.
 * - `sendRecoveryCode` / `verifyRecoveryCode` back the code modality via the
 *   `send-recovery-code` and `verify-recovery-code` Edge Functions: the code is
 *   only verified server-side, and on success the returned recovery session is
 *   applied locally so the reset step is identical to the link modality.
 * - `updatePassword` sets the new password on that session and signs out, so an
 *   unapproved account is not left signed in.
 */
export function usePasswordRecovery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sends the native Supabase recovery e-mail. The link redirects into the app
   * (`baseaut://reset-password`), so it only works when opened on the phone.
   */
  const sendRecoveryLink = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { error: recoverError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: Linking.createURL("reset-password") },
    );

    setLoading(false);

    if (recoverError) {
      setError(translateAuthError(recoverError.message) ?? genericErrorMessage);
      return false;
    }

    return true;
  };

  /**
   * Requests a recovery code to be sent to the given e-mail.
   */
  const sendRecoveryCode = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { error: invokeError } = await supabase.functions.invoke(
      "send-recovery-code",
      { body: { email: email.trim().toLowerCase() } },
    );

    setLoading(false);

    if (invokeError) {
      setError(await extractFunctionError(invokeError));
      return false;
    }

    return true;
  };

  /**
   * Validates the recovery code. On a match the Edge Function returns a recovery
   * session, which is applied locally so the reset screen can update the
   * password on the front, exactly like the link modality.
   */
  const verifyRecoveryCode = async (
    email: string,
    code: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke<RecoverySession>(
      "verify-recovery-code",
      {
        body: {
          email: email.trim().toLowerCase(),
          code: code.trim(),
        },
      },
    );

    if (invokeError) {
      setLoading(false);
      setError(await extractFunctionError(invokeError));
      return false;
    }

    if (!data?.access_token || !data?.refresh_token) {
      setLoading(false);
      setError(genericErrorMessage);
      return false;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    setLoading(false);

    if (sessionError) {
      setError(genericErrorMessage);
      return false;
    }

    return true;
  };

  /**
   * Sets the new password on the current recovery session and signs out, so an
   * account still awaiting approval is not left authenticated.
   */
  const updatePassword = async (newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setLoading(false);
      setError(translateAuthError(updateError.message) ?? genericErrorMessage);
      return false;
    }

    await supabase.auth.signOut();
    setLoading(false);
    return true;
  };

  return {
    sendRecoveryLink,
    sendRecoveryCode,
    verifyRecoveryCode,
    updatePassword,
    loading,
    error,
    setError,
  };
}
