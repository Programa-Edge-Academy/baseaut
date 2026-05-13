/**
 * Edge Function: verify-recovery-code
 * US 1.6 — Validar código e redefinir senha
 *
 * Fluxo:
 *  1. Recebe { email, code, new_password } via POST JSON
 *  2. Busca a solicitação mais recente não-validada para o e-mail
 *  3. Verifica se o código não expirou
 *  4. Compara SHA-256 do código recebido com o hash armazenado
 *  5. Marca a solicitação como validada
 *  6. Atualiza a senha via Supabase Auth Admin API
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Comprimento mínimo da nova senha. */
const MIN_PASSWORD_LENGTH = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna SHA-256 do código em hex. Idêntico ao de send-recovery-code. */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Comparação em tempo constante de duas strings.
 * Evita timing attacks na comparação de hashes.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
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

  // ── 1. Parse e validação do body ────────────────────────────────────────────
  let email: string;
  let code: string;
  let newPassword: string;

  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
    code = (body.code ?? "").trim();
    newPassword = body.new_password ?? "";
  } catch {
    return json({ error: "Body JSON inválido." }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "E-mail inválido." }, 400);
  }

  // Código deve ter exatamente 6 dígitos
  if (!code || !/^\d{6}$/.test(code)) {
    return json({ error: "Código inválido. Deve conter 6 dígitos." }, 400);
  }

  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    return json(
      {
        error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      },
      400
    );
  }

  // ── 2. Inicializa cliente Supabase com service role ─────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[verify-recovery-code] Variáveis de ambiente ausentes.");
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── 3. Busca o profile pelo e-mail ──────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, status_conta")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("[verify-recovery-code] Erro ao buscar profile:", profileError);
    return json({ error: "Erro interno do servidor." }, 500);
  }

  // Mensagem genérica: não revela se o e-mail existe ou não
  if (!profile) {
    return json({ error: "Código inválido ou expirado." }, 400);
  }

  if (profile.status_conta === "bloqueada") {
    return json({ error: "Conta bloqueada. Entre em contato com o suporte." }, 403);
  }

  // ── 4. Busca a solicitação mais recente não-validada ────────────────────────
  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes_recuperacao")
    .select("id, codigo_hash, expira_em")
    .eq("usuario_id", profile.id)
    .eq("validada", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (solicitacaoError) {
    console.error(
      "[verify-recovery-code] Erro ao buscar solicitação:",
      solicitacaoError
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  if (!solicitacao) {
    return json({ error: "Código inválido ou expirado." }, 400);
  }

  // ── 5. Verifica expiração ───────────────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(solicitacao.expira_em);

  if (now > expiresAt) {
    // Marca como validada para limpar o registro expirado
    await supabase
      .from("solicitacoes_recuperacao")
      .update({ validada: true })
      .eq("id", solicitacao.id);

    return json({ error: "Código inválido ou expirado." }, 400);
  }

  // ── 6. Valida o código via comparação de hashes em tempo constante ──────────
  const receivedHash = await hashCode(code);
  const isValid = timingSafeEqual(receivedHash, solicitacao.codigo_hash);

  if (!isValid) {
    return json({ error: "Código inválido ou expirado." }, 400);
  }

  // ── 7. Marca solicitação como usada (antes de alterar a senha) ──────────────
  const { error: markError } = await supabase
    .from("solicitacoes_recuperacao")
    .update({ validada: true })
    .eq("id", solicitacao.id);

  if (markError) {
    console.error(
      "[verify-recovery-code] Erro ao marcar solicitação como validada:",
      markError
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  // ── 8. Atualiza a senha via Admin API do Supabase Auth ──────────────────────
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    profile.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error(
      "[verify-recovery-code] Erro ao atualizar senha:",
      updateError
    );

    // Desfaz a marcação para permitir nova tentativa
    await supabase
      .from("solicitacoes_recuperacao")
      .update({ validada: false })
      .eq("id", solicitacao.id);

    return json({ error: "Erro ao atualizar senha. Tente novamente." }, 500);
  }

  // ── 9. Resposta de sucesso ──────────────────────────────────────────────────
  return json({ message: "Senha atualizada com sucesso." });
});
