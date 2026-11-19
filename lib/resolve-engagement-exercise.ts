import { cachedRead } from "@/lib/offline/cache";
import { supabase } from "@/lib/supabase";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";

/**
 * Resolve o id do exercício-sentinela "Atividade de Engajamento" da equipe ativa
 * (tag = 'engajamento', ativo = false). Cria sob demanda caso ainda não exista
 * (resiliência: a migration de seed pode não ter sido aplicada ainda).
 *
 * Execuções de engajamento referenciam esse id em execucoes_exercicio.
 */
export async function resolveEngagementExerciseId(): Promise<string | null> {
  const equipeId = await resolveEquipeId();
  if (!equipeId) return null;

  // Cached so engagement activities can be recorded offline; offline with
  // nothing saved yet, it falls through and the insert below fails as before.
  const existingId = await cachedRead(`engajamento:${equipeId}`, async () => {
    const { data: existing, error: existingError } = await supabase
      .from("exercicios")
      .select("id")
      .eq("equipe_id", equipeId)
      .eq("tag", "engajamento")
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    return (existing?.id as string | undefined) ?? null;
  }, { cacheFirst: true }).catch(() => null);

  if (existingId) return existingId;

  const { data: inserted, error } = await supabase
    .from("exercicios")
    .insert({
      titulo: "Atividade de Engajamento",
      descricao:
        "Atividade avulsa de engajamento registrada durante circuitos semi-estruturados.",
      equipe_id: equipeId,
      ativo: false,
      tag: "engajamento",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao resolver exercício de engajamento:", error);
    return null;
  }

  return inserted.id;
}
