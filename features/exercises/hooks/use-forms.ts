// import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

/**
 * Represents a Form entry from the formulários table.
 */
export type Form = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
};

// ─────────────────────────────────────────────────────────────
// 🧪 MOCK — remover quando o banco tiver formulários reais
// ─────────────────────────────────────────────────────────────
const MOCK_FORMS: Form[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    titulo: "Formulário de Avaliação",
    descricao: "Formulário padrão de avaliação",
    tipo: "avaliacao",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    titulo: "Formulário de Sessão",
    descricao: "Formulário de registro de sessão",
    tipo: "sessao",
  },
];
// ─────────────────────────────────────────────────────────────

/*
// ⬇️ DESCOMENTAR quando o banco tiver formulários reais e remover o mock acima

async function resolveEquipeId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
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

*/

/**
 * Custom hook that fetches active forms for the current user's team.
 * Em modo de teste retorna dados mockados sem chamar o Supabase.
 */
export function useForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ─────────────────────────────────────────────────────────────
  // substituir pelo loadForms real abaixo quando pronto
  // ─────────────────────────────────────────────────────────────
  const loadForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setForms(MOCK_FORMS);
    } catch (caught: any) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, []);
  // ─────────────────────────────────────────────────────────────

  /*
  // ⬇️ DESCOMENTAR quando o banco tiver formulários reais e remover o mock acima

  const loadForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const teamId = await resolveEquipeId();
      if (!teamId) throw new Error("User is not associated with any active team.");

      const { data, error: fetchError } = await supabase
        .from("formulários")
        .select("id, titulo, descricao, tipo")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("titulo", { ascending: true });

      if (fetchError) throw fetchError;

      setForms(
        (data ?? []).map((row: any) => ({
          id: row.id,
          titulo: row.titulo,
          descricao: row.descricao ?? null,
          tipo: row.tipo,
        }))
      );
    } catch (caught: any) {
      setError(caught);
      console.error("Error loading forms:", caught);
    } finally {
      setIsLoading(false);
    }
  }, []);

  */

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  return { forms, isLoading, error, refresh: loadForms };
}