import { useCallback, useRef, useState } from "react";

import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { getCurrentUser } from "@/lib/offline/auth";
import { newId } from "@/lib/offline/ids";
import { readFormMeta, readFormQuestions, resolveSessionFormId } from "@/lib/offline/session-form";
import { queueWrite } from "@/lib/offline/sync";
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
  /**
   * Row id, generated on the device the first time the record is persisted and
   * kept on the record so a resend reuses it instead of creating a duplicate.
   */
  id?: string;
  exercicioId: string;
  ordemExecucao: number;
  statusRealizacao: StatusRealizacao;
  nivelDesenvolvimento?: NivelDesenvolvimento | null;
  registroAjuda?: RegistroAjuda | null;
  complementosAjuda?: string[] | null;
  /** One or more reasons the exercise was not performed. */
  motivoNaoRealizacao?: MotivoNaoRealizacao[] | null;
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
  /** One or more reasons the session was ended early. */
  motivoFinalizacao?: MotivoNaoRealizacao[] | null;
  descricaoMotivo?: string | null;
};

/**
 * Ids known on this device for sessions started in this run, so finishing a
 * session does not need to read back rows that may still be in the outbox.
 */
const formularioIdBySession = new Map<string, string>();
const circuitIdBySession = new Map<string, string>();
const executionIdsBySession = new Map<string, Map<string, string>>();

/** Options for {@link useSessionFlow}. */
export type UseSessionFlowOptions = {
  /** When true, all writes are no-ops on in-memory ids (tutorial only). */
  mock?: boolean;
};

/**
 * Database side-effects for an ongoing session: creating the `sessoes` row,
 * persisting executed exercises into `execucoes_exercicio`, and closing the
 * session.
 *
 * @remarks
 * Writes go through the offline outbox ({@link queueWrite}): they are saved on
 * the device first and sent to Supabase in order, right away when online or
 * once the connection returns. Ids are generated on the device so a session can
 * start and finish without a round trip. RLS still applies when each write is
 * sent.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) so every write is a
 * no-op against an in-memory session id instead of Supabase.
 */
export function useSessionFlow(options?: UseSessionFlowOptions) {
  const { t } = useI18n();
  const isMock = options?.mock ?? false;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const savingRef = useRef(false);
  const mockIdRef = useRef(0);

  /** Creates a new in-progress `sessoes` row and returns its id. */
  const createSession = useCallback(
    async ({
      alunoId,
      circuitoId = null,
      formularioId = null,
    }: CreateSessionInput): Promise<string> => {
      if (isMock) {
        mockIdRef.current += 1;
        return `mock-session-${mockIdRef.current}`;
      }
      // The login saved on the device; works offline even with an expired token.
      const user = await getCurrentUser();
      if (!user) throw new Error(t("common.err.notAuthenticated"));

      const equipeId = await resolveEquipeId();
      if (!equipeId) throw new Error(t("common.err.activeTeamNotFound"));

      const id = newId();
      await queueWrite({
        kind: "insert",
        table: "sessoes",
        payload: {
          id,
          aluno_id: alunoId,
          equipe_id: equipeId,
          monitor_id: user.id,
          circuito_id: circuitoId,
          formulario_id: formularioId,
          status: "em_andamento",
          data_inicio: new Date().toISOString(),
        },
      });
      // Without an explicit form, the Control Record is created by a trigger
      // when the row is inserted, so its id is read back later instead.
      if (formularioId) formularioIdBySession.set(id, formularioId);
      if (circuitoId) circuitIdBySession.set(id, circuitoId);
      return id;
    },
    [isMock],
  );

  /** Inserts one row per execution record, allowing repeated/engagement entries. */
  const persistExecutions = useCallback(
    async (
      sessaoId: string,
      records: ExecutionRecord[],
    ): Promise<InsertedExecution[]> => {
      if (isMock) {
        return records.map((record, index) => ({
          id: `mock-exec-${index}`,
          exercicio_id: record.exercicioId,
        }));
      }
      if (!records.length) return [];

      const payload = records.map((record) => ({
        id: (record.id ??= newId()),
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

      await queueWrite({
        kind: "upsert",
        table: "execucoes_exercicio",
        payload,
        onConflict: "id",
        ignoreDuplicates: true,
      });

      const inserted = payload.map((row) => ({ id: row.id, exercicio_id: row.exercicio_id }));
      const known = executionIdsBySession.get(sessaoId) ?? new Map<string, string>();
      for (const row of inserted) known.set(row.exercicio_id, row.id);
      executionIdsBySession.set(sessaoId, known);
      return inserted;
    },
    [isMock],
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
      if (isMock) return;
      if (!crises.length) return;

      const payload = crises.map((crise) => ({
        id: newId(),
        sessao_id: sessaoId,
        execucao_id: execucaoIdByExercicio.get(crise.exercicioId) ?? null,
        tipo: crise.tipo ?? "crise",
        duracao_segundos: Math.round(crise.durationSeconds),
      }));

      await queueWrite({ kind: "insert", table: "comportamentos_sessao", payload });
    },
    [isMock],
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
      if (isMock) return;
      await queueWrite({
        kind: "update",
        table: "sessoes",
        payload: {
          status,
          data_fim: new Date().toISOString(),
          motivo_finalizacao: motivoFinalizacao,
          descricao_motivo: descricaoMotivo,
        },
        match: { id: sessaoId },
      });
    },
    [isMock],
  );

  /**
   * Closes the session and links crises. Executions are persisted incrementally
   * during the session, so this only links the crises (looking up the ids of the
   * already-saved executions) and finalizes the session.
   */
  const saveSession = useCallback(
    async (
      sessaoId: string,
      records: ExecutionRecord[],
      crises: CrisisRecord[] = [],
      finishInput: FinishSessionInput = {},
    ): Promise<void> => {
      if (isMock) return;
      if (savingRef.current) return;
      savingRef.current = true;
      setIsSaving(true);
      setError(null);
      try {
        // Ids generated on this device come first; only executions saved in an
        // earlier run (a resumed session) need to be read back, and offline that
        // read just finds nothing and the crisis stays unlinked.
        const execucaoIdByExercicio = new Map(executionIdsBySession.get(sessaoId));
        for (const record of records) {
          if (record.id) execucaoIdByExercicio.set(record.exercicioId, record.id);
        }
        if (crises.some((crise) => !execucaoIdByExercicio.has(crise.exercicioId))) {
          const { data } = await supabase
            .from("execucoes_exercicio")
            .select("id, exercicio_id")
            .eq("sessao_id", sessaoId);
          for (const row of data ?? []) {
            if (!execucaoIdByExercicio.has(row.exercicio_id)) {
              execucaoIdByExercicio.set(row.exercicio_id, row.id);
            }
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
    [isMock, persistCrises, finishSession],
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
      motivo: MotivoNaoRealizacao[] = ["outro"],
      descricao: string = "Sessão encerrada para iniciar uma nova.",
    ): Promise<void> => {
      if (isMock) return;
      const MOTIVO: MotivoNaoRealizacao[] = motivo;
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
              id: newId(),
              sessao_id: sessaoId,
              exercicio_id: it.exercicio_id,
              ordem_execucao: baseOrdem + i + 1,
              status_realizacao: "nao_realizada" as StatusRealizacao,
              motivo_nao_realizacao: MOTIVO,
              descricao_adicional: DESCRICAO,
            }));
            await queueWrite({ kind: "insert", table: "execucoes_exercicio", payload });
          }
        }
      }

      await finishSession(sessaoId, {
        status: "concluida",
        motivoFinalizacao: MOTIVO,
        descricaoMotivo: DESCRICAO,
      });
    },
    [isMock, finishSession],
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
      if (isMock) return;
      if (!sessaoId) return;

      await queueWrite({
        kind: "update",
        table: "sessoes",
        payload: { tempo_total: totalSeconds },
        match: { id: sessaoId },
      });

      // Offline the form may be the circuit's template; the questions are the
      // same, and the outbox attaches the answers to the real instance.
      const formId =
        formularioIdBySession.get(sessaoId) ??
        (await resolveSessionFormId(sessaoId, circuitIdBySession.get(sessaoId) ?? null));
      if (!formId) return;

      const form = await readFormMeta(formId).catch(() => null);
      const sourceId = form?.template_origem_id ?? formId;

      const perguntas = await readFormQuestions(sourceId).catch(() => [] as any[]);

      if (!perguntas.length) return;

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
        await queueWrite({ kind: "sessionFormAnswers", sessaoId, rows: payload });
      }
    },
    [isMock],
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
