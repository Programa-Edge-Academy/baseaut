import type { TranslationKey } from "@/features/settings/constants/translations";

/** Localized string getter, matching the shape of `useI18n().t`. */
type Translate = (key: TranslationKey) => string;

/**
 * Maps Supabase auth errors to localized, UI-friendly messages, covering
 * e-mail, phone (SMS OTP) and Google OAuth flows. Pass the `t` function from
 * {@link useI18n} so the message is returned in the active locale.
 */
export function translateAuthError(
  msg: string | null | undefined,
  t: Translate,
): string | null {
  if (!msg) return null;
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes("invalid login credentials"))
    return t("auth.err.invalidCredentials");
  if (lowerMsg.includes("user already registered"))
    return t("auth.err.alreadyRegistered");
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests"))
    return t("auth.err.rateLimit");
  if (lowerMsg.includes("60 seconds")) return t("auth.err.wait60");
  if (lowerMsg.includes("email not confirmed")) return t("auth.err.emailNotConfirmed");
  if (lowerMsg.includes("phone not confirmed")) return t("auth.err.phoneNotConfirmed");
  if (lowerMsg.includes("invalid phone")) return t("auth.err.invalidPhone");
  if (
    lowerMsg.includes("sms") &&
    (lowerMsg.includes("provider") || lowerMsg.includes("disabled") || lowerMsg.includes("not configured"))
  )
    return t("auth.err.smsUnavailable");
  if (lowerMsg.includes("phone_provider_disabled") || lowerMsg.includes("phone provider"))
    return t("auth.err.smsUnavailable");
  if (lowerMsg.includes("otp") && lowerMsg.includes("expired"))
    return t("auth.err.otpExpired");
  if (lowerMsg.includes("token has expired") || lowerMsg.includes("invalid otp") || lowerMsg.includes("otp"))
    return t("auth.err.otpInvalid");
  if (lowerMsg.includes("provider is not enabled") || lowerMsg.includes("unsupported provider"))
    return t("auth.err.googleUnavailable");
  if (lowerMsg.includes("popup") || lowerMsg.includes("cancel"))
    return t("auth.err.loginCancelled");
  if (lowerMsg.includes("network") || lowerMsg.includes("fetch"))
    return t("auth.err.network");

  return t("auth.err.generic");
}
