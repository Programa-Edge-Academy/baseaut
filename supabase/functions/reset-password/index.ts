/**
 * Edge Function: reset-password
 *
 * Responsabilidade:
 * - Receber email, code e new_password.
 * - Confirmar que existe uma solicitação validada.
 * - Revalidar o código.
 * - Atualizar a senha do usuário.
 * - Deletar a solicitação usada para impedir reutilização.
 *
 * Opção A:
 * - Não usa campo usada_em.
 * - Depois do reset bem-sucedido, deleta a solicitação.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;

  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}

function isStrongPassword(password: string): boolean {
  if (password.length < 8 || password.length > 20) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;

  return true;
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
  let code = "";
  let newPassword = "";

  try {
    const body = await req.json();

    email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    code = String(body.code ?? "").trim();
    newPassword = String(body.new_password ?? "");
  } catch {
    return json({ error: "Body JSON inválido." }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(
      { error: "Sessão de recuperação expirada. Solicite um novo código." },
      400,
    );
  }

  if (!/^\d{6}$/.test(code)) {
    return json(
      { error: "Sessão de recuperação expirada. Solicite um novo código." },
      400,
    );
  }

  if (!isStrongPassword(newPassword)) {
    return json(
      { error: "A senha não atende aos requisitos de segurança." },
      400,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[reset-password] Variáveis de ambiente ausentes.");
    return json({ error: "Erro interno do servidor." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, status_conta")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("[reset-password] Erro ao buscar profile:", profileError);
    return json({ error: "Erro interno do servidor." }, 500);
  }

  if (!profile) {
    return json(
      { error: "Sessão de recuperação expirada. Solicite um novo código." },
      400,
    );
  }

  if (profile.status_conta === "bloqueada") {
    return json({ error: "Conta bloqueada. Entre em contato com o suporte." }, 403);
  }

  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes_recuperacao")
    .select("id, codigo_hash, expira_em")
    .eq("usuario_id", profile.id)
    .eq("canal", "email")
    .eq("validada", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (solicitacaoError) {
    console.error(
      "[reset-password] Erro ao buscar solicitação validada:",
      solicitacaoError,
    );
    return json({ error: "Erro interno do servidor." }, 500);
  }

  if (!solicitacao) {
    return json(
      { error: "Sessão de recuperação expirada. Solicite um novo código." },
      400,
    );
  }

  const now = new Date();
  const expiraEm = new Date(solicitacao.expira_em);

  if (now > expiraEm) {
    await supabase
      .from("solicitacoes_recuperacao")
      .delete()
      .eq("id", solicitacao.id);

    return json(
      { error: "Sessão de recuperação expirada. Solicite um novo código." },
      400,
    );
  }

  const receivedHash = await hashCode(code);
  const isValidCode = timingSafeEqual(receivedHash, solicitacao.codigo_hash);

  if (!isValidCode) {
    return json(
      { error: "Sessão de recuperação expirada. Solicite um novo código." },
      400,
    );
  }

  const { error: updatePasswordError } =
    await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

  if (updatePasswordError) {
    console.error(
      "[reset-password] Erro ao atualizar senha:",
      updatePasswordError,
    );
    return json({ error: "Erro ao atualizar senha. Tente novamente." }, 500);
  }

  /**
   * Opção A:
   * Depois de usar o código para redefinir senha, deletamos a solicitação.
   * Isso impede reutilização do mesmo código.
   */
  const { error: deleteUsedError } = await supabase
    .from("solicitacoes_recuperacao")
    .delete()
    .eq("id", solicitacao.id);

  if (deleteUsedError) {
    console.error(
      "[reset-password] Senha alterada, mas falhou ao deletar solicitação:",
      deleteUsedError,
    );

    /**
     * A senha já foi alterada.
     * Ainda assim retornamos sucesso para não confundir o usuário.
     * O log acima deve ser monitorado.
     */
  }

  return json({
    message: "Senha redefinida com sucesso.",
  });
});