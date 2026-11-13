import { supabase } from "@/lib/supabase";
import { cachedRead } from "./cache";
import { isNetworkError } from "./errors";
import { isOnline } from "./require-online";

/** Columns of `perguntas` every form screen reads; one shape per cache key. */
const QUESTION_COLUMNS = "id, texto_pergunta, tipo_resposta, opcoes, descricao, obrigatoria, ordem";

/** Unsent Control Record answers of a session, shown again if the form reopens. */
export const rcDraftKey = (sessaoId: string) => `rc-draft:${sessaoId}`;

/**
 * Resolves the Control Record form to show for a session.
 *
 * The per-session instance is created by a database trigger when the session
 * row reaches Supabase. Until then (offline, or while the insert waits in the
 * outbox) the circuit's template is used instead: instances read their
 * questions from the template, and answers are tied to the real instance only
 * when they are sent (see the `sessionFormAnswers` outbox op).
 */
export async function resolveSessionFormId(
  sessaoId: string,
  circuitId: string | null,
): Promise<string | null> {
  if (await isOnline()) {
    const { data, error } = await supabase
      .from("sessoes")
      .select("formulario_id")
      .eq("id", sessaoId)
      .maybeSingle();
    if (data?.formulario_id) return data.formulario_id as string;
    if (error && !isNetworkError(error)) return null;
  }
  if (!circuitId) return null;

  return cachedRead(`circuito-form:${circuitId}`, async () => {
    const { data: circuito, error: circuitoError } = await supabase
      .from("circuitos")
      .select("formulario_id")
      .eq("id", circuitId)
      .maybeSingle();
    if (circuitoError) throw circuitoError;
    return (circuito?.formulario_id as string | null | undefined) ?? null;
  }, { cacheFirst: true }).catch(() => null);
}

/** A form's type and template, cached so the form opens offline. */
export function readFormMeta(
  formularioId: string,
): Promise<{ template_origem_id: string | null; tipo: string | null } | null> {
  return cachedRead(`formulario:${formularioId}`, async () => {
    const { data, error } = await supabase
      .from("formularios")
      .select("template_origem_id, tipo")
      .eq("id", formularioId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }, { cacheFirst: true });
}

/** A form's questions in order, cached so the form opens offline. */
export function readFormQuestions(sourceId: string): Promise<any[]> {
  return cachedRead(`perguntas:${sourceId}`, async () => {
    const { data, error } = await supabase
      .from("perguntas")
      .select(QUESTION_COLUMNS)
      .eq("formulario_id", sourceId)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }, { cacheFirst: true });
}
