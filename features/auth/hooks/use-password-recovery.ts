import { supabase } from "@/lib/supabase";
import { translateAuthError } from "@/features/auth/utils/translate-auth-error";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { FunctionsHttpError } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { useState } from "react";

/**
 * Reads the localized error message returned by the recovery Edge Functions.
 * Edge Functions answer non-2xx responses as a {@link FunctionsHttpError} whose
 * body still holds a `{ error }` field, so it must be parsed from the context.
 * Falls back to `fallback` when no readable detail is present.
 */
async function extractFunctionError(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
    } catch {
    }
  }
  return fallback;
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
 * - `verifyRecoveryOtp` validates the 8-digit code from the native Supabase
 *   recovery e-mail (`{{ .Token }}`) — no Edge Function or external provider.
 * - `sendRecoveryCode` / `verifyRecoveryCode` back an alternative code modality
 *   via the `send-recovery-code` and `verify-recovery-code` Edge Functions
 *   (Resend); kept for when that sender domain is verified.
 * - `updatePassword` sets the new password on that session and signs out, so an
 *   unapproved account is not left signed in.
 */
export function usePasswordRecovery() {
  const { t } = useI18n();
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
      setError(translateAuthError(recoverError.message, t) ?? t("auth.err.genericRetry"));
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
      setError(await extractFunctionError(invokeError, t("auth.err.genericRetry")));
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
      setError(await extractFunctionError(invokeError, t("auth.err.genericRetry")));
      return false;
    }

    if (!data?.access_token || !data?.refresh_token) {
      setLoading(false);
      setError(t("auth.err.genericRetry"));
      return false;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    setLoading(false);

    if (sessionError) {
      setError(t("auth.err.genericRetry"));
      return false;
    }

    return true;
  };

  /**
   * Validates the 8-digit recovery code from the native Supabase recovery e-mail
   * (`{{ .Token }}`) via {@link supabase.auth.verifyOtp}. On a match Supabase
   * applies the recovery session locally, so the reset screen updates the
   * password exactly like the link modality — with no Edge Function or external
   * e-mail provider involved.
   */
  const verifyRecoveryOtp = async (
    email: string,
    token: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "recovery",
    });

    setLoading(false);

    if (verifyError) {
      const lower = verifyError.message.toLowerCase();
      if (lower.includes("expired") || lower.includes("invalid") || lower.includes("otp")) {
        setError(t("auth.otpInvalidRetry"));
      } else {
        setError(translateAuthError(verifyError.message, t) ?? t("auth.err.genericRetry"));
      }
      return false;
    }

    if (!data.session) {
      setError(t("auth.err.genericRetry"));
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
      setError(translateAuthError(updateError.message, t) ?? t("auth.err.genericRetry"));
      return false;
    }

    await supabase.auth.signOut();
    setLoading(false);
    return true;
  };

  return {
    sendRecoveryLink,
    verifyRecoveryOtp,
    sendRecoveryCode,
    verifyRecoveryCode,
    updatePassword,
    loading,
    error,
    setError,
  };
}
