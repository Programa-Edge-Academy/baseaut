/**
 * Edge Function: send-recovery-code
 * US 1.5 — Solicitar recuperação de senha
 *
 * Fluxo:
 *  1. Recebe { email, canal? } via POST JSON
 *  2. Valida se o e-mail existe em profiles
 *  3. Invalida solicitações anteriores ainda abertas
 *  4. Gera código numérico de 6 dígitos (criptograficamente seguro)
 *  5. Persiste SHA-256 do código + expira_em na tabela solicitacoes_recuperacao
 *  6. Dispara e-mail real via API do Resend
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configurações ────────────────────────────────────────────────────────────

/** Minutos até o código expirar. Altere via variável de ambiente se necessário. */
const EXPIRY_MINUTES = parseInt(Deno.env.get("RECOVERY_EXPIRY_MINUTES") ?? "15");

/** Remetente padrão do e-mail. Deve ser um domínio verificado no Resend. */
const EMAIL_FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@baseaut.edge.net.br";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Gera um código numérico de 6 dígitos usando crypto seguro.
 * Usa rejeição de amostras para garantir distribuição uniforme.
 */
function generateSecureCode(): string {
  // Gera até encontrar valor no range [0, 999999]
  while (true) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    // Limita a 1_000_000 para evitar bias (2^32 não é múltiplo exato de 10^6)
    if (buf[0] < 4_000_000_000) {
      return String(buf[0] % 1_000_000).padStart(6, "0");
    }
  }
}

/** Retorna SHA-256 do código em hex. */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Resposta HTTP padronizada. Nunca expõe detalhes internos ao cliente. */
function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Handler Principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Apenas POST aceito
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  // ── 1. Parse do body ────────────────────────────────────────────────────────
  let email: string;
  let canal: "email" | "telefone" = "email";

  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
    if (body.canal === "telefone") canal = "telefone";
  } catch {
    return json({ error: "Body JSON inválido." }, 400);
  }

  // Validação básica de formato de e-mail
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "E-mail inválido." }, 400);
  }

  // ── 2. Inicializa cliente Supabase com service role (bypassa RLS) ───────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[send-recovery-code] Variáveis de ambiente ausentes.");
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── 3. Verifica se o e-mail existe em profiles ──────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nome_completo, status_conta")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("[send-recovery-code] Erro ao buscar profile:", profileError);
    return json({ error: "Erro interno do servidor." }, 500);
  }

  // Retornamos 200 mesmo para e-mail inexistente: evita enumeração de usuários
  if (!profile) {
    return json({
      message:
        "Se esse e-mail estiver cadastrado, você receberá um código em instantes.",
    });
  }

  // Conta bloqueada não deve receber código de recuperação
  if (profile.status_conta === "bloqueada") {
    return json({
      message:
        "Se esse e-mail estiver cadastrado, você receberá um código em instantes.",
    });
  }

  // ── 3a. Verifica limite de envios por hora (anti-spam) ─────────────────────
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: recentCount, error: countError } = await supabase
    .from("solicitacoes_recuperacao")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", profile.id)
    .gte("created_at", oneHourAgo);

  if (countError) {
    console.error(
      "[send-recovery-code] Erro ao contar solicitações recentes:",
      countError
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  if ((recentCount ?? 0) >= 3) {
    // Retorna a mesma mensagem genérica de sucesso para não revelar o rate limit
    return json({
      message:
        "Se esse e-mail estiver cadastrado, você receberá um código em instantes.",
    });
  }

  // ── 4. Invalida solicitações anteriores do mesmo usuário ────────────────────
  const { error: invalidateError } = await supabase
    .from("solicitacoes_recuperacao")
    .update({ validada: true })
    .eq("usuario_id", profile.id)
    .eq("validada", false);

  if (invalidateError) {
    console.error(
      "[send-recovery-code] Erro ao invalidar solicitações antigas:",
      invalidateError
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  // ── 5. Gera código e persiste hash ──────────────────────────────────────────
  const code = generateSecureCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("solicitacoes_recuperacao")
    .insert({
      usuario_id: profile.id,
      codigo_hash: codeHash,
      canal,
      expira_em: expiresAt,
      validada: false,
    });

  if (insertError) {
    console.error(
      "[send-recovery-code] Erro ao inserir solicitação:",
      insertError
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  // ── 6. Dispara e-mail via Resend ────────────────────────────────────────────
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.error("[send-recovery-code] RESEND_API_KEY não configurada.");
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const emailPayload = {
    from: EMAIL_FROM,
    to: [email],
    subject: "Seu código de recuperação de senha — BaseAut",
    html: buildEmailHtml(profile.nome_completo, code, EXPIRY_MINUTES),
    text: buildEmailText(profile.nome_completo, code, EXPIRY_MINUTES),
  };

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    console.error("[send-recovery-code] Falha no Resend:", resendError);
    return json({ error: "Erro ao enviar e-mail. Tente novamente." }, 500);
  }

  // ── 7. Resposta de sucesso ──────────────────────────────────────────────────
  return json({
    message:
      "Se esse e-mail estiver cadastrado, você receberá um código em instantes.",
  });
});

// ─── Templates de E-mail ──────────────────────────────────────────────────────

function buildEmailHtml(nome: string, code: string, expiryMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>Código de recuperação — BaseAut</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 440px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
            <tr>
              <td style="padding: 36px 36px 8px 36px;">
                <div style="font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                  <span style="color: #0e89e5;">Base</span><span style="color: #25c125;">Aut</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 36px 0 36px;">
                <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #14181f;">Recuperação de senha</h1>
                <p style="margin: 0; font-size: 15px; line-height: 22px; color: #5a6675;">
                  Olá, <strong style="color: #14181f;">${escapeHtml(nome)}</strong>. Use o código abaixo para redefinir a senha da sua conta.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 36px 8px 36px;">
                <div style="text-align: center; padding: 20px 16px; background-color: #f0f7ff; border: 1px solid #cfe6fb; border-radius: 12px;">
                  <div style="font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #0e6bb5; font-family: 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;">${code}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 36px 0 36px;">
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: #5a6675;">
                  Digite-o no aplicativo para escolher uma nova senha. O código é válido por <strong style="color: #14181f;">${expiryMinutes} minutos</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 36px 36px 36px;">
                <p style="margin: 0; font-size: 13px; line-height: 19px; color: #96a0ac;">
                  Se você não solicitou a recuperação de senha, ignore este e-mail — sua senha permanecerá a mesma.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin: 20px 0 0 0; font-size: 12px; color: #96a0ac;">© BaseAut</p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function buildEmailText(nome: string, code: string, expiryMinutes: number): string {
  return [
    `Recuperação de senha — BaseAut`,
    ``,
    `Olá, ${nome}.`,
    ``,
    `Seu código de recuperação: ${code}`,
    ``,
    `Válido por ${expiryMinutes} minutos.`,
    ``,
    `Se você não solicitou a recuperação de senha, ignore este e-mail.`,
  ].join("\n");
}

/** Escapa caracteres HTML para evitar XSS no template de e-mail. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
