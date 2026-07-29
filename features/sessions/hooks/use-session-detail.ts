import { supabase } from "@/lib/supabase";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useEffect, useState, useCallback } from "react";
import type { ActivityRecordItem, ActivityRecordUpdate } from "@/features/sessions/components/activity-record-card";

/** Title, date, and executions of a single session. */
export interface SessionDetailData {
  sessionTitle: string;
  sessionDate: string;
  executions: ActivityRecordItem[];
}

/**
 * Seed detail for the tutorial's mock session record (`mock-hist-session`),
 * matching the two exercises of the mock circuit. Both executions are complete,
 * so the practice is editing an already-filled record rather than resolving a
 * pendency — the pending Control Record covers that case.
 */
const buildMockSessionDetail = (
  t: (key: TranslationKey) => string,
): SessionDetailData => ({
  sessionTitle: t("mock.circuit1"),
  sessionDate: "26/06/2026",
  executions: [
    {
      id: "mock-exec-linha",
      title: t("mock.exWalkLine"),
      durationSeconds: 95,
      statusRealizacao: "realizada",
      nivelDesenvolvimento: "intermediario",
      registroAjuda: "autonomo",
      complementosAjuda: ["verbal"],
      motivoNaoRealizacao: null,
      descricaoAdicional: null,
    },
    {
      id: "mock-exec-bambole",
      title: t("mock.exHoop"),
      durationSeconds: 140,
      statusRealizacao: "realizada",
      nivelDesenvolvimento: "inicial",
      registroAjuda: "ajuda_intrusiva",
      complementosAjuda: null,
      motivoNaoRealizacao: null,
      descricaoAdicional: null,
    },
  ],
});

/** Options for {@link useSessionDetail}. */
export type UseSessionDetailOptions = {
  /**
   * When true, the hook runs entirely on in-memory mock data with no Supabase
   * access, used by the tutorial's history simulation.
   */
  mock?: boolean;
};

/**
 * Loads a session's details and executions, tracks whether its Control Record
 * still has pending required questions, and exposes execution update and session
 * cancellation actions.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) to operate on seeded
 * in-memory data instead of Supabase.
 */
export function useSessionDetail(
  sessionId: string,
  fallbackTitle?: string,
  options?: UseSessionDetailOptions,
) {
  const isMock = options?.mock ?? false;
  const { t } = useI18n();
  const [data, setData] = useState<SessionDetailData | null>(
    isMock ? buildMockSessionDetail(t) : null,
  );
  const [isLoading, setIsLoading] = useState(!isMock);
  const [error, setError] = useState<Error | null>(null);
  const [rcPending, setRcPending] = useState(isMock);

  const fetchDetail = useCallback(async () => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
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
        circuitTitle || fallbackTitle || t("session.clinicalSession");

      const sessionDate = sessionData?.data_inicio
        ? new Date(sessionData.data_inicio).toLocaleDateString("pt-BR")
        : t("common.dateUndefined");

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
        title: e.exercicio_id?.titulo || t("export.doc.exercise"),
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
      setError(err instanceof Error ? err : new Error(t("sessionDetail.loadError")));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, fallbackTitle, isMock]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /** Persists an execution's edited values and updates local state. */
  async function updateExecution(execId: string, values: ActivityRecordUpdate) {
    if (!isMock) {
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
    }

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
    if (isMock) return;

    const { error } = await supabase.rpc("rpc_cancelar_sessao", {
      p_sessao_id: sessionId,
    });

    if (error) throw error;
  }

  return { data, isLoading, error, rcPending, updateExecution, deleteSession, refetch: fetchDetail };
}
