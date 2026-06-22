import { useCallback, useRef, useState } from "react";

import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { supabase } from "@/lib/supabase";

// "adiado" depende da adição do valor ao enum status_realizacao_enum no backend.
export type StatusRealizacao = "realizada" | "nao_realizada" | "adiado";
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

type CreateSessionInput = {
  alunoId: string;
  circuitoId?: string | null;
  formularioId?: string | null;
};

type FinishSessionInput = {
  status?: "concluida" | "cancelada";
  // A coluna sessoes.motivo_finalizacao usa motivo_nao_realizacao_enum.
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

      // Cada execução vira uma linha nova (INSERT). Permite repetir o mesmo
      // exercício na sessão e registrar várias atividades de engajamento.
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
   * Closes the session and links crises. As execuções já foram persistidas
   * incrementalmente durante a sessão, então aqui apenas vinculamos as crises
   * (buscando os ids das execuções já gravadas) e finalizamos.
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
   * Finaliza uma sessão em andamento "de fora" da tela de execução (ex.: ao
   * iniciar uma nova sessão concorrente). Marca como concluída e, se o circuito
   * for estruturado, grava os exercícios não realizados (sem execução) como
   * 'nao_realizada' com motivo/descrição padrão. Lê tudo do banco — não depende
   * do estado em memória da tela de sessão.
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

        // Só circuitos estruturados têm um conjunto fixo de exercícios a marcar
        // como não realizados; o semi-estruturado é de seleção livre.
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
   * Ao encerrar a sessão, grava o tempo total em sessoes.tempo_total e replica
   * os valores automáticos no RC da sessão:
   *  • pergunta "Tempo da sessão"  → total em segundos;
   *  • pergunta "Fugas (número de fugas e tempo do ocorrido)" →
   *    "<n> - (mm:ss,mm:ss), ...", com início/fim no cronômetro total.
   * Essas perguntas não são exibidas durante a execução (preenchidas aqui),
   * mas podem ser editadas depois no RC pelo histórico.
   */
  const finalizeSessionAutoFill = useCallback(
    async (
      sessaoId: string,
      totalSeconds: number,
      fugaIntervals: { start: number; end: number }[],
    ): Promise<void> => {
      if (!sessaoId) return;

      // 1. tempo_total na própria sessão.
      await supabase
        .from("sessoes")
        .update({ tempo_total: totalSeconds })
        .eq("id", sessaoId);

      // 2. instância de RC da sessão.
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

/** Títulos das perguntas de RC preenchidas automaticamente pela sessão. */
export const RC_AUTO_FILLED_TITLES = [
  "Tempo da sessão",
  "Fugas (número de fugas e tempo do ocorrido)",
];
