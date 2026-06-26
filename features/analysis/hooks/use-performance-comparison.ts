import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Aggregated performance comparison between two periods returned by the RPC. */
export interface ComparisonData {
  resumo: {
    sessoes_p1: number;
    sessoes_p2: number;
    diferenca_absoluta: number;
    variacao_percentual: number;
  };
  ajuda: {
    autonomo: {
      p1: number;
      p2: number;
      diferenca_absoluta: number;
      variacao_percentual: number;
    };
    ajuda_intrusiva: {
      p1: number;
      p2: number;
      diferenca_absoluta: number;
      variacao_percentual: number;
    };
  };
  exercicios: Array<{
    exercicio_id: string;
    titulo: string;
    nivel_p1: string | null;
    nivel_p2: string | null;
    peso_p1: number | null;
    peso_p2: number | null;
    variacao_nivel: number | null;
  }>;
  comportamentos: {
    estereotipia: { p1: number; p2: number; diferenca_absoluta: number };
    contato_visual_pessoas: { p1: number; p2: number; diferenca_absoluta: number };
    contato_visual_objetos: { p1: number; p2: number; diferenca_absoluta: number };
    engajamento: { p1: number; p2: number; diferenca_absoluta: number };
    fuga: { p1: number; p2: number; diferenca_absoluta: number };
    crise: { p1: number; p2: number; diferenca_absoluta: number };
    inapto: { p1: number; p2: number; diferenca_absoluta: number };
    atividade_preferencial: { p1: number; p2: number; diferenca_absoluta: number };
  };
}

/** Normalizes a date string to a full-day start or end ISO boundary (UTC-3). */
function fixDateBoundaries(dateStr?: string | null, isEndOfDay = false): string | null {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr;
  return isEndOfDay 
    ? `${dateStr}T23:59:59.999-03:00` 
    : `${dateStr}T00:00:00.000-03:00`;
}

/**
 * Loads the performance comparison between two date ranges for a student. The
 * request runs only when `enabled` is true and all dates are provided.
 */
export function usePerformanceComparison(
  alunoId: string,
  p1Inicio?: string | null,
  p1Fim?: string | null,
  p2Inicio?: string | null,
  p2Fim?: string | null,
  enabled?: boolean
) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchComparison() {
      if (!enabled || !alunoId || !p1Inicio || !p1Fim || !p2Inicio || !p2Fim) {
        if (isMounted) setData(null);
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        const payload = {
          p_aluno_id: alunoId,
          p_p1_inicio: fixDateBoundaries(p1Inicio, false),
          p_p1_fim: fixDateBoundaries(p1Fim, true),
          p_p2_inicio: fixDateBoundaries(p2Inicio, false),
          p_p2_fim: fixDateBoundaries(p2Fim, true),
        };

        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "rpc_comparar_desempenho_periodos",
          payload
        );

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        if (!isMounted) return;

        let parsedData = rpcData;
        if (typeof rpcData === "string") {
          try {
            parsedData = rpcData.trim() !== "" ? JSON.parse(rpcData) : null;
          } catch (parseError) {
            parsedData = null;
          }
        }

        setData(parsedData);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Erro ao carregar comparação de desempenho.");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchComparison();

    return () => {
      isMounted = false;
    };
  }, [alunoId, p1Inicio, p1Fim, p2Inicio, p2Fim, enabled]);

  return { data, isLoading, error };
}
