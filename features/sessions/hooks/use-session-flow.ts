import { useCallback, useRef, useState } from "react";

import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { supabase } from "@/lib/supabase";

/** Execution status. "adiado" requires the matching value in the backend `status_realizacao_enum`. */
export type StatusRealizacao = "realizada" | "nao_realizada" | "adiado";
/** Motor development level recorded for an execution. */
export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";
/** Whether the student performed autonomously, with intrusive help, or not applicable. */
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva" | "nao_se_aplica";
/** Reason an exercise was not completed. */
export type MotivoNaoRealizacao =
  | "recusa_aluno"
  | "comportamento_disruptivo"
  | "fadiga_cansaco"
  | "tempo_insuficiente"
  | "dificuldade_fisica"
  | "outro";
/** Reason a whole session was ended early. */
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

/**
 * One behavior episode (crisis or flight) timed during an exercise, stored in
 * comportamentos_sessao. `tipo` defaults to "crise" for backward compatibility.
 */
export type CrisisRecord = {
  exercicioId: string;
  durationSeconds: number;
  tipo?: "crise" | "fuga";
};

/** Inserted execution row, used to link crises to the matching execution. */
export type InsertedExecution = {
  id: string;
  exercicio_id: string;
};

/** Input for creating a session. */
type CreateSessionInput = {
  alunoId: string;
  circuitoId?: string | null;
  formularioId?: string | null;
};

/** Input for finishing a session. */
type FinishSessionInput = {
  status?: "concluida" | "cancelada";
  /** Stored in `sessoes.motivo_finalizacao`, which uses `motivo_nao_realizacao_enum`. */
  motivoFinalizacao?: MotivoNaoRealizacao | null;
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

  /** Creates a new in-progress `sessoes` row and returns its id. */
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

  /** Inserts one row per execution record, allowing repeated/engagement entries. */
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
        tipo: crise.tipo ?? "crise",
        duracao_segundos: Math.round(crise.durationSeconds),
      }));

      const { error: insertError } = await supabase
        .from("comportamentos_sessao")
        .insert(payload);

      if (insertError) throw insertError;
    },
    [],
  );

  /** Marks a session as completed or cancelled with an optional reason. */
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
   * Closes the session and links crises. Executions are persisted incrementally
   * during the session, so this only links the crises (looking up the ids of the
   * already-saved executions) and finalizes the session.
   */
  const saveSession = useCallback(
    async (
      sessaoId: string,
      _records: ExecutionRecord[],
      crises: CrisisRecord[] = [],
      finishInput: FinishSessionInput = {},
    ): Promise<void> => {
      if (savingRef.current) return;
      savingRef.current = true;
      setIsSaving(true);
      setError(null);
      try {
        let execucaoIdByExercicio = new Map<string, string>();
        if (crises.length) {
          const { data } = await supabase
            .from("execucoes_exercicio")
            .select("id, exercicio_id")
            .eq("sessao_id", sessaoId);
          for (const row of data ?? []) {
            execucaoIdByExercicio.set(row.exercicio_id, row.id);
          }
        }
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
    [persistCrises, finishSession],
  );

  /**
   * Finishes an in-progress session from outside the execution screen (e.g. when
   * starting a new concurrent session). Marks it as completed and, for structured
   * circuits, records the unexecuted exercises as 'nao_realizada' with a default
   * reason/description. Reads everything from the database — it does not depend on
   * the session screen's in-memory state.
   */
  const finishSessionAndSaveUnexecuted = useCallback(
    async (
      sessaoId: string,
      motivo: MotivoNaoRealizacao = "outro",
      descricao: string = "Sessão encerrada para iniciar uma nova.",
    ): Promise<void> => {
      const MOTIVO: MotivoNaoRealizacao = motivo;
      const DESCRICAO = descricao;

      const { data: sessao } = await supabase
        .from("sessoes")
        .select("circuito_id")
        .eq("id", sessaoId)
        .maybeSingle();

      const circuitoId = sessao?.circuito_id ?? null;

      if (circuitoId) {
        const { data: circuito } = await supabase
          .from("circuitos")
          .select("modo_execucao")
          .eq("id", circuitoId)
          .maybeSingle();

        if (circuito?.modo_execucao === "estruturado") {
          const [{ data: itens }, { data: execs }] = await Promise.all([
            supabase
              .from("itens_circuito")
              .select("exercicio_id, ordem")
              .eq("circuito_id", circuitoId)
              .order("ordem", { ascending: true }),
            supabase
              .from("execucoes_exercicio")
              .select("exercicio_id")
              .eq("sessao_id", sessaoId),
          ]);

          const executed = new Set((execs ?? []).map((e) => e.exercicio_id));
          const baseOrdem = (execs ?? []).length;
          const unexecuted = (itens ?? []).filter(
            (it) => !executed.has(it.exercicio_id),
          );

          if (unexecuted.length > 0) {
            const payload = unexecuted.map((it, i) => ({
              sessao_id: sessaoId,
              exercicio_id: it.exercicio_id,
              ordem_execucao: baseOrdem + i + 1,
              status_realizacao: "nao_realizada" as StatusRealizacao,
              motivo_nao_realizacao: MOTIVO,
              descricao_adicional: DESCRICAO,
            }));
            const { error: insertError } = await supabase
              .from("execucoes_exercicio")
              .insert(payload);
            if (insertError) throw insertError;
          }
        }
      }

      await finishSession(sessaoId, {
        status: "concluida",
        motivoFinalizacao: MOTIVO,
        descricaoMotivo: DESCRICAO,
      });
    },
    [finishSession],
  );

  /**
   * On session end, writes the total time to `sessoes.tempo_total` and replicates
   * the auto-filled values into the session's Control Record:
   *  - "Tempo da sessão" question → total in seconds;
   *  - "Fugas (número de fugas e tempo do ocorrido)" question →
   *    "<n> - (mm:ss,mm:ss), ...", using the total stopwatch start/end.
   * These questions are not shown during execution (they are filled here) but can
   * be edited later in the Control Record from the history.
   */
  const finalizeSessionAutoFill = useCallback(
    async (
      sessaoId: string,
      totalSeconds: number,
      fugaIntervals: { start: number; end: number }[],
    ): Promise<void> => {
      if (!sessaoId) return;

      await supabase
        .from("sessoes")
        .update({ tempo_total: totalSeconds })
        .eq("id", sessaoId);

      const { data: sessao } = await supabase
        .from("sessoes")
        .select("formulario_id")
        .eq("id", sessaoId)
        .maybeSingle();
      const formId = sessao?.formulario_id;
      if (!formId) return;

      const { data: form } = await supabase
        .from("formularios")
        .select("template_origem_id")
        .eq("id", formId)
        .maybeSingle();
      const sourceId = form?.template_origem_id ?? formId;

      const { data: perguntas } = await supabase
        .from("perguntas")
        .select("id, texto_pergunta")
        .eq("formulario_id", sourceId);

      if (!perguntas?.length) return;

      const normalize = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .trim();

      const findByTitle = (target: string) =>
        perguntas.find((p) =>
          normalize(p.texto_pergunta || "").includes(normalize(target)),
        );

      const tempoQ = findByTitle("Tempo da sessão");
      const fugasQ = findByTitle("Fugas (número de fugas e tempo do ocorrido)");

      const mmss = (s: number) => {
        const safe = Math.max(0, Math.floor(s));
        return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
      };
      const fugasValue =
        fugaIntervals.length === 0
          ? "0"
          : `${fugaIntervals.length} - ${fugaIntervals
              .map((i) => `(${mmss(i.start)},${mmss(i.end)})`)
              .join(", ")}`;

      const payload: any[] = [];
      if (tempoQ) {
        payload.push({
          formulario_id: formId,
          sessao_id: sessaoId,
          pergunta_id: tempoQ.id,
          valor_preenchido: String(totalSeconds),
          status_item: "respondido",
        });
      }
      if (fugasQ) {
        payload.push({
          formulario_id: formId,
          sessao_id: sessaoId,
          pergunta_id: fugasQ.id,
          valor_preenchido: fugasValue,
          status_item: "respondido",
        });
      }

      if (payload.length) {
        await supabase
          .from("respostas_formulario")
          .upsert(payload, { onConflict: "sessao_id, pergunta_id" });
      }
    },
    [],
  );

  return {
    isSaving,
    error,
    createSession,
    persistExecutions,
    persistCrises,
    finishSession,
    finishSessionAndSaveUnexecuted,
    finalizeSessionAutoFill,
    saveSession,
  };
}

/** Titles of the Control Record questions auto-filled by the session. */
export const RC_AUTO_FILLED_TITLES = [
  "Tempo da sessão",
  "Fugas (número de fugas e tempo do ocorrido)",
];
