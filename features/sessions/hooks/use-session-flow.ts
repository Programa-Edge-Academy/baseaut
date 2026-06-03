import { useCallback, useRef, useState } from "react";

import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { supabase } from "@/lib/supabase";

/**
 * Realization status of a single exercise execution (DB enum
 * `status_realizacao_enum`).
 */
export type StatusRealizacao = "realizada" | "nao_realizada";

/** Development level recorded for a realized exercise (`nivel_desenvolvimento_enum`). */
export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";

/** Assistance register recorded for a realized exercise (`registro_ajuda_enum`). */
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva" | "nao_se_aplica";

/** Reason an exercise was not realized (`motivo_nao_realizacao_enum`). */
export type MotivoNaoRealizacao =
  | "recusa_aluno"
  | "comportamento_disruptivo"
  | "fadiga_cansaco"
  | "tempo_insuficiente"
  | "dificuldade_fisica"
  | "outro";

/** Reason a session was finished early (`motivo_finalizacao_enum`). */
export type MotivoFinalizacao =
  | "comportamento_disruptivo"
  | "tempo_esgotado"
  | "indisposicao_aluno"
  | "problema_tecnico"
  | "outro";

/**
 * One persisted exercise execution. Mirrors the columns of
 * `execucoes_exercicio` so the screen can accumulate results and hand them to
 * the persistence layer in a single batch.
 */
export type ExecutionRecord = {
  exercicioId: string;
  ordemExecucao: number;
  statusRealizacao: StatusRealizacao;
  nivelDesenvolvimento?: NivelDesenvolvimento | null;
  registroAjuda?: RegistroAjuda | null;
  complementosAjuda?: string[] | null;
  motivoNaoRealizacao?: MotivoNaoRealizacao | null;
  descricaoAdicional?: string | null;
  duracaoRealSegundos?: number | null;
};

type CreateSessionInput = {
  alunoId: string;
  circuitoId?: string | null;
  formularioId?: string | null;
};

type FinishSessionInput = {
  status?: "concluida" | "cancelada";
  motivoFinalizacao?: MotivoFinalizacao | null;
  descricaoMotivo?: string | null;
};

/**
 * Provides the database side-effects for running a session: creating the
 * `sessoes` row, persisting the executed exercises and closing the session.
 *
 * All writes go through the authenticated Supabase client so RLS applies; the
 * monitor is the current user and the team is resolved from membership.
 */
export function useSessionFlow() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSavingRef = useRef(false);

  const createSession = useCallback(
    async ({
      alunoId,
      circuitoId = null,
      formularioId = null,
    }: CreateSessionInput): Promise<string> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const equipeId = await resolveEquipeId();
      if (!equipeId) throw new Error("Equipe ativa não encontrada.");

      const { data, error: insertError } = await supabase
        .from("sessoes")
        .insert({
          aluno_id: alunoId,
          equipe_id: equipeId,
          monitor_id: user.id,
          circuito_id: circuitoId,
          formulario_id: formularioId,
          status: "em_andamento",
          data_inicio: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      return data.id as string;
    },
    [],
  );

  const persistExecutions = useCallback(
    async (sessaoId: string, records: ExecutionRecord[]): Promise<void> => {
      if (!records.length) return;

      const payload = records.map((record) => ({
        sessao_id: sessaoId,
        exercicio_id: record.exercicioId,
        ordem_execucao: record.ordemExecucao,
        status_realizacao: record.statusRealizacao,
        nivel_desenvolvimento: record.nivelDesenvolvimento ?? null,
        registro_ajuda: record.registroAjuda ?? null,
        complementos_ajuda: record.complementosAjuda ?? null,
        motivo_nao_realizacao: record.motivoNaoRealizacao ?? null,
        descricao_adicional: record.descricaoAdicional ?? null,
        duracao_real_segundos: record.duracaoRealSegundos ?? null,
      }));

      const { error: insertError } = await supabase
        .from("execucoes_exercicio")
        .insert(payload);

      if (insertError) throw insertError;
    },
    [],
  );

  const finishSession = useCallback(
    async (
      sessaoId: string,
      {
        status = "concluida",
        motivoFinalizacao = null,
        descricaoMotivo = null,
      }: FinishSessionInput = {},
    ): Promise<void> => {
      const { error: updateError } = await supabase
        .from("sessoes")
        .update({
          status,
          data_fim: new Date().toISOString(),
          motivo_finalizacao: motivoFinalizacao,
          descricao_motivo: descricaoMotivo,
        })
        .eq("id", sessaoId);

      if (updateError) throw updateError;
    },
    [],
  );

  /**
   * Persists the executed exercises and closes the session in one guarded
   * call, surfacing a single isSaving/error state to the caller.
   */
  const saveSession = useCallback(
    async (
      sessaoId: string,
      records: ExecutionRecord[],
      finishInput: FinishSessionInput = {},
    ): Promise<void> => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);
      setError(null);
      try {
        await persistExecutions(sessaoId, records);
        await finishSession(sessaoId, finishInput);
      } catch (caught: any) {
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        throw caught;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [persistExecutions, finishSession],
  );

  return {
    isSaving,
    error,
    createSession,
    persistExecutions,
    finishSession,
    saveSession,
  };
}
