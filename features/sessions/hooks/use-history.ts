import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export interface StudentHistoryData {
  id: string;
  name: string;
  sessions: number;
  pendencyAlert: boolean;
}

export function useHistory() {
  const [studentsHistory, setStudentsHistory] = useState<StudentHistoryData[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Busca de alunos e sessões
      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select(`id, nome_completo, sessoes(count)`)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (alunosError) throw alunosError;

      // 2. As pendências são buscadas separadamente
      const { data: pendencias, error: pendenciasError } = await supabase
        .from("vw_alunos_pendencias")
        .select("aluno_id, tem_pendencia");

      if (pendenciasError) throw pendenciasError;

      // 3. Cruzamos os dados em memória (Frontend)
      const formattedData: StudentHistoryData[] = (alunos || []).map((item: any) => {
        const totalSessions = item.sessoes?.[0]?.count ?? item.sessoes?.count ?? 0;
        
        // Verifica se existe alguma pendência para este aluno específico
        const temPendencia = pendencias?.some(p => p.aluno_id === item.id && p.tem_pendencia) ?? false;

        return {
          id: item.id,
          name: item.nome_completo,
          sessions: totalSessions,
          pendencyAlert: temPendencia,
        };
      });

      setStudentsHistory(formattedData);
    } catch (err: any) {
      console.error("Erro ao buscar histórico:", err);
      setError(err instanceof Error ? err : new Error("Erro ao carregar histórico"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { studentsHistory, isLoading, error, refetch: fetchHistory };
}
