/**
 * Edge Function: verify-recovery-code
 * US 1.6 — Validar código de recuperação
 *
 * Fluxo:
 *  1. Recebe { email, code } via POST JSON
 *  2. Busca a solicitação mais recente não-validada para o e-mail
 *  3. Verifica limite de tentativas e expiração
 *  4. Compara SHA-256 do código recebido com o hash armazenado
 *  5. Marca a solicitação como validada
 *  6. Emite uma sessão de recuperação (link nativo do Supabase) e a devolve
 *
 * @remarks
 * A função não recebe nem define a nova senha: ela apenas confirma o código e
 * devolve uma sessão de recuperação. A troca de senha é feita pelo front
 * (tela reset-password) via `updateUser`, igual ao fluxo do link por e-mail.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
    code = (body.code ?? "").trim();
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

  // ── 2. Inicializa cliente Supabase com service role ─────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
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
    .select("id, codigo_hash, expira_em, tentativas")
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

  // ── 5a. Verifica limite de tentativas ───────────────────────────────────────
  if (solicitacao.tentativas >= 5) {
    // Invalida a solicitação para forçar nova solicitação de código
    await supabase
      .from("solicitacoes_recuperacao")
      .update({ validada: true })
      .eq("id", solicitacao.id);

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
    // Incrementa tentativas antes de retornar para limitar força-bruta
    await supabase
      .from("solicitacoes_recuperacao")
      .update({ tentativas: solicitacao.tentativas + 1 })
      .eq("id", solicitacao.id);

    return json({ error: "Código inválido ou expirado." }, 400);
  }

  // ── 7. Emite uma sessão de recuperação para o usuário ───────────────────────
  // Gera um link de recuperação nativo (sem enviar e-mail) e troca o token por
  // uma sessão real, que é devolvida ao front para trocar a senha via updateUser.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    console.error("[verify-recovery-code] Erro ao gerar link de recuperação:", linkError);
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });

  const { data: otpData, error: otpError } = await anonClient.auth.verifyOtp({
    type: "recovery",
    token_hash: hashedToken,
  });

  const session = otpData?.session;
  if (otpError || !session) {
    console.error("[verify-recovery-code] Erro ao emitir sessão de recuperação:", otpError);
    return json({ error: "Erro interno do servidor." }, 500);
  }

  // ── 8. Marca a solicitação como usada ───────────────────────────────────────
  await supabase
    .from("solicitacoes_recuperacao")
    .update({ validada: true })
    .eq("id", solicitacao.id);

  // ── 9. Resposta de sucesso com os tokens da sessão ──────────────────────────
  return json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
});
