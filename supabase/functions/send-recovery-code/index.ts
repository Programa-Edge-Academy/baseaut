/**
 * Edge Function: send-recovery-code
 *
 * Responsabilidade:
 * - Receber e-mail.
 * - Gerar código de recuperação.
 * - Invalidar solicitações anteriores deletando os registros antigos.
 * - Salvar hash do novo código em solicitacoes_recuperacao.
 * - Enviar código por e-mail.
 *
 * Opção A:
 * - Não cria nova migration.
 * - Não usa validada=true para invalidar código antigo.
 * - Para invalidar código antigo, deleta a solicitação anterior.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPIRY_MINUTES = Number.parseInt(
  Deno.env.get("RECOVERY_EXPIRY_MINUTES") ?? "15",
  10,
);

const EMAIL_FROM =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@baseaut.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function generateSecureCode(): string {
  while (true) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);

    if (buffer[0] < 4_000_000_000) {
      return String(buffer[0] % 1_000_000).padStart(6, "0");
    }
  }
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildEmailHtml(
  nome: string | null,
  code: string,
  expiryMinutes: number,
): string {
  const safeName = escapeHtml(nome || "usuário");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Recuperação de senha</h2>

    <p style="color: #444;">Olá, <strong>${safeName}</strong>.</p>

    <p style="color: #444;">
      Use o código abaixo para redefinir sua senha.
      Ele é válido por <strong>${expiryMinutes} minutos</strong>.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1a1a1a; background: #f0f0f0; padding: 16px 24px; border-radius: 8px; display: inline-block;">
        ${code}
      </span>
    </div>

    <p style="color: #888; font-size: 13px;">
      Se você não solicitou a recuperação de senha, ignore este e-mail.
      Sua senha não será alterada.
    </p>
  </div>
</body>
</html>
`.trim();
}

function buildEmailText(
  nome: string | null,
  code: string,
  expiryMinutes: number,
): string {
  return [
    "Recuperação de senha — BaseAut",
    "",
    `Olá, ${nome || "usuário"}.`,
    "",
    `Seu código de recuperação é: ${code}`,
    "",
    `Ele é válido por ${expiryMinutes} minutos.`,
    "",
    "Se você não solicitou a recuperação de senha, ignore este e-mail.",
  ].join("\n");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  let email = "";

  try {
    const body = await req.json();
    email = String(body.email ?? "")
      .trim()
      .toLowerCase();
  } catch {
    return json({ error: "Body JSON inválido." }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "E-mail inválido." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    console.error("[send-recovery-code] Variáveis de ambiente ausentes.");
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nome_completo, status_conta")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("[send-recovery-code] Erro ao buscar profile:", profileError);
    return json({ error: "Erro interno do servidor." }, 500);
  }

  /**
   * Segurança:
   * Retorna sucesso mesmo se o e-mail não existir.
   * Isso evita enumeração de usuários.
   */
  if (!profile || profile.status_conta === "bloqueada") {
    return json({
      message:
        "Se esse e-mail estiver cadastrado, você receberá um código em instantes.",
    });
  }

  /**
   * Opção A:
   * Reenvio invalida códigos anteriores deletando solicitações antigas.
   *
   * Importante:
   * Deleta todas as solicitações do usuário/canal, inclusive validada=true.
   * Isso evita que um código já validado continue podendo redefinir senha
   * depois que o usuário pediu um novo código.
   */
  const { error: deleteOldError } = await supabase
    .from("solicitacoes_recuperacao")
    .delete()
    .eq("usuario_id", profile.id)
    .eq("canal", "email");

  if (deleteOldError) {
    console.error(
      "[send-recovery-code] Erro ao deletar solicitações antigas:",
      deleteOldError,
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const code = generateSecureCode();
  const codigoHash = await hashCode(code);
  const expiraEm = new Date(
    Date.now() + EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await supabase
    .from("solicitacoes_recuperacao")
    .insert({
      usuario_id: profile.id,
      codigo_hash: codigoHash,
      canal: "email",
      expira_em: expiraEm,
      validada: false,
    });

  if (insertError) {
    console.error(
      "[send-recovery-code] Erro ao inserir solicitação:",
      insertError,
    );
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

  return json({
    message:
      "Se esse e-mail estiver cadastrado, você receberá um código em instantes.",
  });
});