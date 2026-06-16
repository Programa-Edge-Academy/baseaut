import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HelpSessionRecord } from "../components/help-records-bar-chart";

/**
 * Hook para buscar a evolução dos registros de ajuda (autonomia) de um aluno.
 * Consome a RPC rpc_get_grafico_autonomia_aluno do Supabase.
 */
export function useHelpRecords(
  studentId?: string,
  startDate?: string | null,
  endDate?: string | null
) {
  const [records, setRecords] = useState<HelpSessionRecord[]>([]);
  const [explanatoryText, setExplanatoryText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function fetchHelpRecords() {
    if (!studentId || !startDate || !endDate) {
      setRecords([]);
      setExplanatoryText("");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startISO = `${startDate}T00:00:00.000Z`;
      const endISO = `${endDate}T23:59:59.999Z`;

      const { data, error: rpcError } = await supabase.rpc(
        "rpc_get_grafico_autonomia_aluno",
        {
          p_aluno_id: studentId,
          p_data_inicio: startISO,
          p_data_fim: endISO,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      if (data) {
        const mappedRecords: HelpSessionRecord[] = (data.sessoes || []).map(
          (session: any, index: number) => {
            return {
              sessionId: session.sessao_id,
              sessionLabel: String(index + 1), // Rótulo sequencial do gráfico (ex: "1", "2", "3")
              intrusiveCount: Number(session.ajuda_intrusiva || 0),
              autonomousCount: Number(session.autonomo || 0),
            };
          }
        );
        setRecords(mappedRecords);
        setExplanatoryText(data.texto_explicativo || "");
      } else {
        setRecords([]);
        setExplanatoryText("");
      }
    } catch (err: any) {
      console.error("Erro ao buscar registros de ajuda:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setRecords([]);
      setExplanatoryText("");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHelpRecords();
  }, [studentId, startDate, endDate]);

  return {
    records,
    explanatoryText,
    isLoading,
    error,
    refetch: fetchHelpRecords,
  };
}
