import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import type { ActivityRecordItem, ActivityRecordUpdate } from "@/features/sessions/components/activity-record-card";

/** Title, date, and executions of a single session. */
export interface SessionDetailData {
  sessionTitle: string;
  sessionDate: string;
  executions: ActivityRecordItem[];
}

/**
 * Loads a session's details and executions, tracks whether its Control Record
 * still has pending required questions, and exposes execution update and session
 * cancellation actions.
 */
export function useSessionDetail(sessionId: string, fallbackTitle?: string) {
  const [data, setData] = useState<SessionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [rcPending, setRcPending] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessoes")
        .select(`
          id,
          numero_sessao,
          data_inicio,
          circuito_id (titulo)
        `)
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      const circuitTitle = (sessionData as any)?.circuito_id?.titulo;
      const sessionTitle =
        circuitTitle || fallbackTitle || "Sessão Clínica";

      const sessionDate = sessionData?.data_inicio
        ? new Date(sessionData.data_inicio).toLocaleDateString("pt-BR")
        : "Data não definida";

      const { data: execData, error: execError } = await supabase
        .from("execucoes_exercicio")
        .select(`
          id,
          duracao_real_segundos,
          nivel_desenvolvimento,
          registro_ajuda,
          complementos_ajuda,
          status_realizacao,
          motivo_nao_realizacao,
          descricao_adicional,
          exercicio_id (titulo)
        `)
        .eq("sessao_id", sessionId)
        .order("ordem_execucao", { ascending: true });

      if (execError) throw execError;

      const executions: ActivityRecordItem[] = (execData || []).map((e: any) => ({
        id: e.id,
        title: e.exercicio_id?.titulo || "Exercício",
        durationSeconds: e.duracao_real_segundos ?? null,
        statusRealizacao: e.status_realizacao ?? "realizada",
        nivelDesenvolvimento: e.nivel_desenvolvimento ?? null,
        registroAjuda: e.registro_ajuda ?? null,
        complementosAjuda: e.complementos_ajuda ?? null,
        motivoNaoRealizacao: e.motivo_nao_realizacao ?? null,
        descricaoAdicional: e.descricao_adicional ?? null,
      }));

      setData({ sessionTitle, sessionDate, executions });

      const { data: pend } = await supabase.rpc("verificar_pendencias_sessao", {
        p_sessao_id: sessionId,
      });
      const parsedPend = typeof pend === "string" ? JSON.parse(pend) : pend;
      setRcPending((parsedPend?.perguntas_pendentes?.length ?? 0) > 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao carregar sessão"));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, fallbackTitle]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /** Persists an execution's edited values and updates local state. */
  async function updateExecution(execId: string, values: ActivityRecordUpdate) {
    const { error } = await supabase
      .from("execucoes_exercicio")
      .update({
        status_realizacao: values.statusRealizacao,
        duracao_real_segundos: values.durationSeconds,
        nivel_desenvolvimento: values.nivelDesenvolvimento,
        registro_ajuda: values.registroAjuda,
        complementos_ajuda: values.complementosAjuda,
        motivo_nao_realizacao: values.motivoNaoRealizacao,
        descricao_adicional: values.descricaoAdicional,
      })
      .eq("id", execId);

    if (error) throw error;

    setData((prev) =>
      prev
        ? {
            ...prev,
            executions: prev.executions.map((e) =>
              e.id === execId
                ? {
                    ...e,
                    statusRealizacao: values.statusRealizacao,
                    durationSeconds: values.durationSeconds,
                    nivelDesenvolvimento: values.nivelDesenvolvimento,
                    registroAjuda: values.registroAjuda,
                    complementosAjuda: values.complementosAjuda,
                    motivoNaoRealizacao: values.motivoNaoRealizacao,
                    descricaoAdicional: values.descricaoAdicional,
                  }
                : e,
            ),
          }
        : prev,
    );
  }

  /**
   * Cancels (soft-deletes) the session via a SECURITY DEFINER RPC, which lets
   * coordinators and non-owner monitors cancel sessions that a direct update
   * would block under the table's row-level security policy.
   */
  async function deleteSession() {
    const { error } = await supabase.rpc("rpc_cancelar_sessao", {
      p_sessao_id: sessionId,
    });

    if (error) throw error;
  }

  return { data, isLoading, error, rcPending, updateExecution, deleteSession, refetch: fetchDetail };
}
