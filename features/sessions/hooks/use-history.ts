import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface StudentHistoryData {
  id: string;
  name: string;
  sessions: number;
  pendencyAlert: boolean;
}

export function useHistory() {
  const [studentsHistory, setStudentsHistory] = useState<StudentHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 2. Lógica de busca e contagem no Supabase
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      /* Buscamos a lista de alunos com a contagem de sessões vinculadas 
        e a coluna que define se ele possui alguma pendência cadastral/médica
      */
      const { data, error: supabaseError } = await supabase
        .from("alunos")
        .select(`
          id,
          nome_completo, 
          sessoes(count)
        `).eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (supabaseError) throw supabaseError;

      // 3. Mapeamento direto para o formato que o componente espera
      const formattedData: StudentHistoryData[] = (data || []).map((item: any) => {
        // Trata o retorno do count aninhado do Supabase
        const totalSessions = item.sessoes?.[0]?.count ?? item.sessoes?.count ?? 0;

        return {
          id: item.id,
          name: item.nome_completo,
          sessions: totalSessions,
          pendencyAlert: false, // Garante conversão estrita para booleano (true/false)
        };
      });

      setStudentsHistory(formattedData);
    } catch (err: any) {
      console.error("Erro ao buscar histórico de sessões dos alunos:", err);
      setError(err instanceof Error ? err : new Error("Erro ao carregar histórico"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    studentsHistory,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}