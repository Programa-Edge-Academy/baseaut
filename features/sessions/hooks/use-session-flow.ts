import { useCallback, useRef, useState } from "react";

import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { supabase } from "@/lib/supabase";

export type StatusRealizacao = "realizada" | "nao_realizada";
export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva" | "nao_se_aplica";
export type MotivoNaoRealizacao =
  | "recusa_aluno"
  | "comportamento_disruptivo"
  | "fadiga_cansaco"
  | "tempo_insuficiente"
  | "dificuldade_fisica"
  | "outro";
export type MotivoFinalizacao =
  | "comportamento_disruptivo"
  | "tempo_esgotado"
  | "indisposicao_aluno"
  | "problema_tecnico"
  | "outro";

/** One persisted exercise execution (mirrors `execucoes_exercicio`). */
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

/** One crisis episode timed during an exercise (stored in comportamentos_sessao). */
export type CrisisRecord = {
  exercicioId: string;
  durationSeconds: number;
};

/** Inserted execution row, used to link crises to the matching execution. */
export type InsertedExecution = {
  id: string;
  exercicio_id: string;
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
 * Database side-effects for an ongoing session: creating the `sessoes` row,
 * persisting executed exercises into `execucoes_exercicio`, and closing the
 * session. All writes go through the authenticated client (RLS applies).
 */
export function useSessionFlow() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const savingRef = useRef(false);

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
    async (
      sessaoId: string,
      records: ExecutionRecord[],
    ): Promise<InsertedExecution[]> => {
      if (!records.length) return [];

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

      const { data, error: insertError } = await supabase
        .from("execucoes_exercicio")
        .insert(payload)
        .select("id, exercicio_id");

      if (insertError) throw insertError;
      return (data ?? []) as InsertedExecution[];
    },
    [],
  );

  /**
   * Saves crisis episodes into comportamentos_sessao, linking each one to the
   * execution of the exercise it happened in (when available).
   */
  const persistCrises = useCallback(
    async (
      sessaoId: string,
      crises: CrisisRecord[],
      execucaoIdByExercicio: Map<string, string>,
    ): Promise<void> => {
      if (!crises.length) return;

      const payload = crises.map((crise) => ({
        sessao_id: sessaoId,
        execucao_id: execucaoIdByExercicio.get(crise.exercicioId) ?? null,
        tipo: "crise",
        duracao_segundos: Math.round(crise.durationSeconds),
      }));

      const { error: insertError } = await supabase
        .from("comportamentos_sessao")
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
   * Persists executions and crises, then closes the session under a single
   * guard. Crises are linked to the execution of their exercise.
   */
  const saveSession = useCallback(
    async (
      sessaoId: string,
      records: ExecutionRecord[],
      crises: CrisisRecord[] = [],
      finishInput: FinishSessionInput = {},
    ): Promise<void> => {
      if (savingRef.current) return;
      savingRef.current = true;
      setIsSaving(true);
      setError(null);
      try {
        const inserted = await persistExecutions(sessaoId, records);
        const execucaoIdByExercicio = new Map(
          inserted.map((row) => [row.exercicio_id, row.id]),
        );
        await persistCrises(sessaoId, crises, execucaoIdByExercicio);
        await finishSession(sessaoId, finishInput);
      } catch (caught: any) {
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        throw caught;
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    },
    [persistExecutions, persistCrises, finishSession],
  );

  return {
    isSaving,
    error,
    createSession,
    persistExecutions,
    persistCrises,
    finishSession,
    saveSession,
  };
}
