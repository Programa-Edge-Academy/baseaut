import { supabase } from "@/lib/supabase";

/**
 * Resolves the active team id for the currently authenticated user.
 *
 * Prefers an active membership in `membros_equipe`; falls back to a team the
 * user coordinates. Returns null when no team can be resolved.
 */
export async function resolveEquipeId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("membros_equipe")
    .select("equipe_id")
    .eq("usuario_id", user.id)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();

  if (member?.equipe_id) return member.equipe_id;

  const { data: team } = await supabase
    .from("equipes")
    .select("id")
    .eq("coordenador_id", user.id)
    .eq("ativa", true)
    .limit(1)
    .maybeSingle();

  return team?.id ?? null;
}
