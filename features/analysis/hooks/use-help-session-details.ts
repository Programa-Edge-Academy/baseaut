import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

/** A single exercise execution's help record within a session. */
export type HelpExerciseDetail = {
  exerciseId: string;
  name: string;
  registroAjuda: "autonomo" | "ajuda_intrusiva";
};

/** A session with its per-exercise help records. */
export type HelpSessionDetail = {
  sessionId: string;
  /** Sequential label matching the help-records bar chart ("1", "2", …). */
  label: string;
  /** "DD/MM/YYYY" session date. */
  dateLabel: string;
  exercises: HelpExerciseDetail[];
};

/** Formats a date/ISO string as DD/MM/YYYY in local time. */
function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Loads, for a student and date range, each completed session with the help
 * records of its exercises. Every execution that has a help record is listed
 * (an exercise repeated within a session yields one entry per execution),
 * grouped by exercise and ordered by execution time within each group.
 *
 * @remarks
 * Reads the Supabase tables directly (no dedicated RPC). The sessions are
 * ordered chronologically so their sequential labels line up with the
 * per-session bar chart.
 */
export function useHelpSessionDetails(
  studentId?: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  const [sessions, setSessions] = useState<HelpSessionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!studentId || !startDate || !endDate) {
      setSessions([]);
      return;
    }
    setIsLoading(true);
    try {
      const startISO = `${startDate}T00:00:00.000Z`;
      const endISO = `${endDate}T23:59:59.999Z`;

      const { data: sessionRows } = await supabase
        .from("sessoes")
        .select("id, data_inicio")
        .eq("aluno_id", studentId)
        .eq("status", "concluida")
        .gte("data_inicio", startISO)
        .lte("data_inicio", endISO)
        .order("data_inicio", { ascending: true });

      const sessionList = sessionRows ?? [];
      if (sessionList.length === 0) {
        setSessions([]);
        return;
      }

      const sessionIds = sessionList.map((s: any) => s.id);

      const { data: execRows } = await supabase
        .from("execucoes_exercicio")
        .select("id, sessao_id, exercicio_id, registro_ajuda, created_at")
        .in("sessao_id", sessionIds)
        .not("registro_ajuda", "is", null);

      // Order by execution time so repeated exercises list in chronological order.
      const execs = (execRows ?? []).sort((a: any, b: any) =>
        a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
      );

      const exercicioIds = [...new Set(execs.map((e: any) => e.exercicio_id))];
      const tituloById = new Map<string, string>();
      if (exercicioIds.length > 0) {
        const { data: exRows } = await supabase
          .from("exercicios")
          .select("id, titulo")
          .in("id", exercicioIds);
        (exRows ?? []).forEach((ex: any) => tituloById.set(ex.id, ex.titulo));
      }

      // Every execution with a help record, grouped by session.
      const bySession = new Map<string, HelpExerciseDetail[]>();
      for (const e of execs) {
        const list = bySession.get(e.sessao_id) ?? [];
        list.push({
          exerciseId: e.exercicio_id,
          name: tituloById.get(e.exercicio_id) ?? "Exercício",
          registroAjuda: e.registro_ajuda,
        });
        bySession.set(e.sessao_id, list);
      }

      const result: HelpSessionDetail[] = sessionList.map((s: any, index: number) => ({
        sessionId: s.id,
        label: String(index + 1),
        dateLabel: formatDateLabel(s.data_inicio),
        exercises: (bySession.get(s.id) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }));

      setSessions(result);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, startDate, endDate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { sessions, isLoading, refetch: fetch };
}
