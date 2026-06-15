// import { supabase } from "@/lib/supabase";
// import { resolveEquipeId } from "@/lib/resolve-equipe-id";
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