import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export interface StudentHistoryData {
  id: string;
  name: string;
  sessions: number;
  pendencyAlert: boolean;
  avatarUrl: string | null;
}

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

      // 1. Busca de alunos.
      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select(`id, nome_completo, avatar_url`)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (alunosError) throw alunosError;

      // 2. Contagem de registros = sessões + formulários do aluno (mesma regra
      // da tela de Análises), excluindo sessões canceladas e formulários do tipo
      // "registro_controle" (instâncias de RC por sessão).
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

      // 3. Pendências de uma vez via view (otimizado), igual à tela de alunos.
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
      console.error("Erro ao buscar histórico:", err);
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
