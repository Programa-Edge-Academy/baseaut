import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { ExecutionRecord } from "./use-session-flow";

export type ResumeData = {
  executions: ExecutionRecord[];
};

/**
 * Loads existing executions for a session so the caller can reconstruct
 * the in-progress state (executionsRef, historicoExercicios, currentIndex).
 * Returns null while loading or when no sessaoId is provided.
 */
export function useResumeSession(sessaoId: string | null) {
  const [data, setData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sessaoId) return;
    setIsLoading(true);

    supabase
      .from("execucoes_exercicio")
      .select(
        "exercicio_id, ordem_execucao, status_realizacao, nivel_desenvolvimento, registro_ajuda, complementos_ajuda, motivo_nao_realizacao, descricao_adicional, duracao_real_segundos",
      )
      .eq("sessao_id", sessaoId)
      .order("ordem_execucao", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) {
          console.error("Erro ao carregar execuções para retomada:", error);
          setIsLoading(false);
          return;
        }
        const executions: ExecutionRecord[] = (rows ?? []).map((r: any) => ({
          exercicioId: r.exercicio_id,
          ordemExecucao: r.ordem_execucao,
          statusRealizacao: r.status_realizacao,
          nivelDesenvolvimento: r.nivel_desenvolvimento ?? null,
          registroAjuda: r.registro_ajuda ?? null,
          complementosAjuda: r.complementos_ajuda ?? null,
          motivoNaoRealizacao: r.motivo_nao_realizacao ?? null,
          descricaoAdicional: r.descricao_adicional ?? null,
          duracaoRealSegundos: r.duracao_real_segundos ?? null,
        }));
        setData({ executions });
        setIsLoading(false);
      });
  }, [sessaoId]);

  return { data, isLoading };
}
