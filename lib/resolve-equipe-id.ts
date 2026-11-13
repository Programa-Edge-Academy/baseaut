import { getCurrentUser } from "@/lib/offline/auth";
import { cachedRead } from "@/lib/offline/cache";
import { supabase } from "@/lib/supabase";

/**
 * Resolves the active team id for the currently authenticated user.
 *
 * Prefers an active membership in `membros_equipe`; falls back to a team the
 * user coordinates. Returns null when no team can be resolved.
 *
 * Reads the login saved on the device ({@link getCurrentUser}) and keeps the
 * last answer, so it also works offline.
 */
export async function resolveEquipeId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    return await cachedRead(`equipe:${user.id}`, async () => {
      const { data: member, error: memberError } = await supabase
        .from("membros_equipe")
        .select("equipe_id")
        .eq("usuario_id", user.id)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle();
      if (memberError) throw memberError;

      if (member?.equipe_id) return member.equipe_id as string;

      const { data: team, error: teamError } = await supabase
        .from("equipes")
        .select("id")
        .eq("coordenador_id", user.id)
        .eq("ativa", true)
        .limit(1)
        .maybeSingle();
      if (teamError) throw teamError;

      return (team?.id as string | undefined) ?? null;
    }, { cacheFirst: true });
  } catch {
    return null;
  }
}
