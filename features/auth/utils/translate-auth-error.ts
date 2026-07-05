/**
 * Maps Supabase auth errors to localized, UI-friendly pt-BR messages, covering
 * e-mail, phone (SMS OTP) and Google OAuth flows.
 */
export function translateAuthError(msg: string | null | undefined): string | null {
  if (!msg) return null;
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes("invalid login credentials"))
    return "Credenciais incorretas. Verifique e tente novamente.";
  if (lowerMsg.includes("user already registered"))
    return "Esta conta já está cadastrada.";
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests"))
    return "Muitas tentativas. Tente novamente mais tarde.";
  if (lowerMsg.includes("60 seconds"))
    return "Aguarde 60 segundos para tentar novamente.";
  if (lowerMsg.includes("email not confirmed")) return "E-mail não confirmado.";
  if (lowerMsg.includes("phone not confirmed"))
    return "Telefone não confirmado. Refaça o cadastro para receber um novo código.";
  if (lowerMsg.includes("invalid phone"))
    return "Telefone inválido. Use o formato (DDD) 99999-9999.";
  if (
    lowerMsg.includes("sms") &&
    (lowerMsg.includes("provider") || lowerMsg.includes("disabled") || lowerMsg.includes("not configured"))
  )
    return "Cadastro por telefone indisponível no momento. Use e-mail ou Google.";
  if (lowerMsg.includes("phone_provider_disabled") || lowerMsg.includes("phone provider"))
    return "Cadastro por telefone indisponível no momento. Use e-mail ou Google.";
  if (lowerMsg.includes("otp") && lowerMsg.includes("expired"))
    return "Código expirado. Solicite um novo código.";
  if (lowerMsg.includes("token has expired") || lowerMsg.includes("invalid otp") || lowerMsg.includes("otp"))
    return "Código inválido ou expirado. Confira o SMS e tente novamente.";
  if (lowerMsg.includes("provider is not enabled") || lowerMsg.includes("unsupported provider"))
    return "Login com Google indisponível no momento.";
  if (lowerMsg.includes("popup") || lowerMsg.includes("cancel"))
    return "Login cancelado.";
  if (lowerMsg.includes("network") || lowerMsg.includes("fetch"))
    return "Falha de conexão. Verifique sua internet.";

  return "Ocorreu um erro. Verifique seus dados e tente novamente.";
}
