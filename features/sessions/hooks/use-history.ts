import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

/** A student row for the history list, with its record count and pendency flag. */
export interface StudentHistoryData {
  id: string;
  name: string;
  sessions: number;
  pendencyAlert: boolean;
  avatarUrl: string | null;
}

/**
 * Loads all active students with their record counts (sessions plus non-control
 * forms, excluding cancelled sessions) and pending-item flags.
 */
export function useHistory() {
  const [studentsHistory, setStudentsHistory] = useState<StudentHistoryData[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select(`id, nome_completo, avatar_url`)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (alunosError) throw alunosError;

      const [{ data: sessions }, { data: forms }] = await Promise.all([
        supabase.from("sessoes").select("aluno_id").neq("status", "cancelada"),
        supabase
          .from("formularios")
          .select("aluno_id")
          .neq("tipo", "registro_controle")
          .eq("ativo", true),
      ]);

      const counts: Record<string, number> = {};
      sessions?.forEach((s) => {
        if (s.aluno_id) counts[s.aluno_id] = (counts[s.aluno_id] || 0) + 1;
      });
      forms?.forEach((f) => {
        if (f.aluno_id) counts[f.aluno_id] = (counts[f.aluno_id] || 0) + 1;
      });

      const { data: pendencias } = await supabase
        .from("vw_alunos_pendencias")
        .select("aluno_id, tem_pendencia");

      const formattedData: StudentHistoryData[] = (alunos || []).map(
        (item: any) => {
          const temPendencia =
            pendencias?.some(
              (p) => p.aluno_id === item.id && p.tem_pendencia
            ) ?? false;

          return {
            id: item.id,
            name: item.nome_completo,
            sessions: counts[item.id] ?? 0,
            pendencyAlert: temPendencia,
            avatarUrl: item.avatar_url,
          };
        }
      );

      setStudentsHistory(formattedData);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error("Erro ao carregar histórico"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { studentsHistory, isLoading, error, refetch: fetchHistory };
}
