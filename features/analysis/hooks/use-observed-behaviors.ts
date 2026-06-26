import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import {
  BehaviorRecord,
  BehaviorType,
} from "@/features/analysis/components/observed-behaviors-chart";

/**
 * Maps the behavior types stored in the database (Portuguese) to the frontend
 * types (English). The "outro" type is intentionally omitted (not charted).
 */
const TIPO_TO_BEHAVIOR_TYPE: Record<string, BehaviorType | undefined> = {
  estereotipia: "stereotypy",
  engajamento: "engagement",
  fuga: "escape",
  crise: "crisis",
  inapto: "unfit",
  atividade_preferencial: "preferred_activity",
};

/**
 * Resolves the BehaviorType for a behavior row. Eye contact is split into
 * "people" and "objects" using the `observacao` column.
 */
function resolveBehaviorType(
  tipo: string,
  observacao: string | null,
): BehaviorType | undefined {
  if (tipo === "contato_visual") {
    const obs = (observacao ?? "").toLowerCase();
    if (obs.includes("objeto")) return "eye_contact_objects";
    if (obs.includes("pessoa")) return "eye_contact_people";
    return undefined;
  }
  return TIPO_TO_BEHAVIOR_TYPE[tipo];
}

/** Formats a Date as an ISO "YYYY-MM-DD" string, ignoring timezone. */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Loads a student's observed behaviors over a date range directly from the
 * Supabase tables.
 *
 * @returns `records` (BehaviorRecord list grouped by type and date),
 * `exercises` (associated exercises keyed by BehaviorType), and
 * `isLoading` / `error` / `refetch`.
 */
export function useObservedBehaviors(
  studentId?: string,
  startDate?: Date | null,
  endDate?: Date | null,
) {
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [exercises, setExercises] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBehaviors = useCallback(async () => {
    if (!studentId || !startDate || !endDate) {
      setRecords([]);
      setExercises({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startISO = toISODate(startDate);
      const endPlusOne = new Date(endDate);
      endPlusOne.setDate(endPlusOne.getDate() + 1);
      const endISO = toISODate(endPlusOne);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessoes")
        .select("id, data_inicio")
        .eq("aluno_id", studentId)
        .eq("status", "concluida")
        .gte("data_inicio", startISO)
        .lt("data_inicio", endISO);

      if (sessionsError) throw sessionsError;

      const sessionList = sessionsData ?? [];
      if (sessionList.length === 0) {
        setRecords([]);
        setExercises({});
        return;
      }

      const sessionIds = sessionList.map((s: any) => s.id);
      const sessionDateMap = new Map<string, string>();
      sessionList.forEach((s: any) => {
        sessionDateMap.set(s.id, s.data_inicio);
      });

      const { data: behaviorsData, error: behaviorsError } = await supabase
        .from("comportamentos_sessao")
        .select("id, tipo, execucao_id, sessao_id, observacao")
        .in("sessao_id", sessionIds)
        .neq("tipo", "outro");

      if (behaviorsError) throw behaviorsError;

      const behaviorsList = behaviorsData ?? [];

      const execucaoIds = [
        ...new Set(
          behaviorsList.map((b: any) => b.execucao_id).filter(Boolean),
        ),
      ];

      const exerciseNameByExecId = new Map<string, string>();

      if (execucaoIds.length > 0) {
        const { data: execData, error: execError } = await supabase
          .from("execucoes_exercicio")
          .select("id, exercicio_id")
          .in("id", execucaoIds);

        if (!execError && execData && execData.length > 0) {
          const exercicioIds = [
            ...new Set(execData.map((e: any) => e.exercicio_id)),
          ];

          const { data: exercisesData } = await supabase
            .from("exercicios")
            .select("id, titulo")
            .in("id", exercicioIds);

          const tituloById = new Map<string, string>();
          (exercisesData ?? []).forEach((ex: any) => {
            tituloById.set(ex.id, ex.titulo);
          });

          execData.forEach((e: any) => {
            const titulo = tituloById.get(e.exercicio_id);
            if (titulo) exerciseNameByExecId.set(e.id, titulo);
          });
        }
      }

      const groupMap = new Map<
        string,
        { tipo: string; date: string; count: number }
      >();

      behaviorsList.forEach((b: any) => {
        const behaviorType = resolveBehaviorType(b.tipo, b.observacao);
        if (!behaviorType) return;

        const sessionDate = sessionDateMap.get(b.sessao_id);
        if (!sessionDate) return;

        const dateOnly = sessionDate.substring(0, 10);
        const key = `${behaviorType}::${dateOnly}`;

        const existing = groupMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          groupMap.set(key, { tipo: behaviorType, date: dateOnly, count: 1 });
        }
      });

      const newRecords: BehaviorRecord[] = [];
      let idx = 0;
      groupMap.forEach((group) => {
        newRecords.push({
          id: `bhv-${idx++}`,
          behaviorType: group.tipo as BehaviorType,
          date: group.date,
          frequency: group.count,
        });
      });

      const exercisesMap: Record<string, string[]> = {};

      behaviorsList.forEach((b: any) => {
        const behaviorType = resolveBehaviorType(b.tipo, b.observacao);
        if (!behaviorType || !b.execucao_id) return;

        const exerciseName = exerciseNameByExecId.get(b.execucao_id);
        if (!exerciseName) return;

        if (!exercisesMap[behaviorType]) {
          exercisesMap[behaviorType] = [];
        }
        if (!exercisesMap[behaviorType].includes(exerciseName)) {
          exercisesMap[behaviorType].push(exerciseName);
        }
      });

      setRecords(newRecords);
      setExercises(exercisesMap);
    } catch (caught: any) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
      setRecords([]);
      setExercises({});
    } finally {
      setIsLoading(false);
    }
  }, [studentId, startDate, endDate]);

  useEffect(() => {
    fetchBehaviors();
  }, [fetchBehaviors]);

  return { records, exercises, isLoading, error, refetch: fetchBehaviors };
}
