import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
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
      // Body was not JSON; fall back to the generic message.
    }
  }
  return genericErrorMessage;
}

/**
 * Payload required to validate a recovery code and set a new password.
 */
type VerifyRecoveryData = {
  email: string;
  code: string;
  newPassword: string;
};

/**
 * Drives the password recovery flow backed by the recovery Edge Functions:
 * `send-recovery-code` issues a 6-digit code by e-mail and `verify-recovery-code`
 * validates that code and updates the user password in a single call.
 */
export function usePasswordRecovery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * Validates the recovery code and updates the user password.
   */
  const verifyRecoveryCode = async ({
    email,
    code,
    newPassword,
  }: VerifyRecoveryData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const { error: invokeError } = await supabase.functions.invoke(
      "verify-recovery-code",
      {
        body: {
          email: email.trim().toLowerCase(),
          code: code.trim(),
          new_password: newPassword,
        },
      },
    );

    setLoading(false);

    if (invokeError) {
      setError(await extractFunctionError(invokeError));
      return false;
    }

    return true;
  };

  return { sendRecoveryCode, verifyRecoveryCode, loading, error, setError };
}
