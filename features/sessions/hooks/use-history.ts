import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export interface StudentHistoryData {
  id: string;
  name: string;
  sessions: number;
  pendencyAlert: boolean;
  avatarUrl: string | null; // 🛠️ ADICIONADO: Nova propriedade na interface
}

export function useHistory() {
  const [studentsHistory, setStudentsHistory] = useState<StudentHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Busca de alunos e sessões
      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        // 🛠️ ATUALIZADO: Adicionado 'avatar_url' no select para trazer a imagem do banco
        .select(`id, nome_completo, avatar_url, sessoes(count)`)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (alunosError) throw alunosError;

      // 2. Dispara as chamadas da RPC para todos os alunos em paralelo
      const formattedData: StudentHistoryData[] = await Promise.all(
        (alunos || []).map(async (item: any) => {
          const totalSessions = item.sessoes?.[0]?.count ?? item.sessoes?.count ?? 0;
          
          // Chama a RPC passando o parâmetro esperado (p_aluno_id)
          const { data: temPendencia, error: rpcError } = await supabase.rpc(
            "rpc_check_pendencia_aluno", 
            { p_aluno_id: item.id }
          );

          if (rpcError) {
            console.error(`Erro ao verificar pendência do aluno ${item.nome_completo}:`, rpcError);
          }

          return {
            id: item.id,
            name: item.nome_completo,
            sessions: totalSessions,
            pendencyAlert: temPendencia ?? false, 
            avatarUrl: item.avatar_url, // 🛠️ ADICIONADO: Mapeando o retorno do banco para o estado do front
          };
        })
      );

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