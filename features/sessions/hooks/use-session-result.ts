import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type {
  MotivoNaoRealizacao,
  NivelDesenvolvimento,
  RegistroAjuda,
  StatusRealizacao,
} from "./use-session-flow";

/** A single support register attached to an execution. */
export type SupportRegister = {
  id: string;
  tipo: string;
  intensidade: number;
  observacao: string | null;
  created_at: string;
};

/** One consolidated exercise execution returned by `get_resultado_sessao`. */
export type SessionResultExercise = {
  id: string;
  titulo: string;
  ordem_execucao: number;
  status_realizacao: StatusRealizacao;
  nivel_desenvolvimento: NivelDesenvolvimento | null;
  registro_ajuda: RegistroAjuda | null;
  complementos_ajuda: string[] | null;
  motivo_nao_realizacao: MotivoNaoRealizacao | null;
  descricao_adicional: string | null;
  duracao_real_segundos: number | null;
  registros_suporte: SupportRegister[];
};

export type SessionResult = {
  exercicios: SessionResultExercise[];
  registro_controle_id: string | null;
};

/** Derived counters used by the completion and detail screens. */
export type SessionResultSummary = {
  total: number;
  realizedCount: number;
  unrealizedCount: number;
};

/**
 * Reads the consolidated result of a session through the
 * `get_resultado_sessao` RPC and exposes derived counters.
 */
export function useSessionResult(sessaoId?: string | null) {
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(sessaoId));
  const [error, setError] = useState<Error | null>(null);

  const fetchResult = useCallback(async () => {
    if (!sessaoId) return;

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_resultado_sessao",
        { p_sessao_id: sessaoId },
      );

      if (rpcError) throw rpcError;

      const parsed = (data ?? { exercicios: [], registro_controle_id: null }) as SessionResult;
      setResult(parsed);
    } catch (caught: any) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [sessaoId]);

  useEffect(() => {
    if (sessaoId) fetchResult();
  }, [sessaoId, fetchResult]);

  const exercises = result?.exercicios ?? [];
  const summary: SessionResultSummary = {
    total: exercises.length,
    realizedCount: exercises.filter((e) => e.status_realizacao === "realizada").length,
    unrealizedCount: exercises.filter((e) => e.status_realizacao === "nao_realizada").length,
  };

  return { result, summary, isLoading, error, refetch: fetchResult };
}
