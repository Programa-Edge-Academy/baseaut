import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { ExerciseProgressRecord } from "../components/exercise-progress-chart";

/** A translator function bound to the active locale. */
type Translate = (key: TranslationKey) => string;

/** Per-exercise progress summary with status, evolution, and history records. */
export type ExerciseProgress = {
  id: string;
  title: string;
  statusLabel: string;
  statusTone: "green" | "yellow" | "red" | "gray";
  sessions: number;
  evolutionLabel: string;
  evolutionTone: "green" | "yellow" | "red" | "gray";
  records: ExerciseProgressRecord[];
};

/** Seed per-exercise progress for the tutorial's mock analysis (June 2026). */
function buildMockExerciseProgress(t: Translate): ExerciseProgress[] {
  const p1 = mapLastPerformance("maduro", t);
  const p2 = mapLastPerformance("intermediario", t);
  return [
    {
      id: "mock-ex-1",
      title: "Andar na linha",
      statusLabel: p1.label,
      statusTone: p1.tone,
      sessions: 5,
      evolutionLabel: t("analysis.evolution.improved"),
      evolutionTone: "green",
      records: [
        { id: "mp1", sessionId: "", date: "12/06", rawDate: "2026-06-12", executionStatus: "realizada", developmentLevel: "inicial" },
        { id: "mp2", sessionId: "", date: "19/06", rawDate: "2026-06-19", executionStatus: "realizada", developmentLevel: "intermediario" },
        { id: "mp3", sessionId: "", date: "26/06", rawDate: "2026-06-26", executionStatus: "realizada", developmentLevel: "maduro" },
      ],
    },
    {
      id: "mock-ex-2",
      title: "Girar bambolê",
      statusLabel: p2.label,
      statusTone: p2.tone,
      sessions: 4,
      evolutionLabel: t("analysis.evolution.stable"),
      evolutionTone: "yellow",
      records: [
        { id: "mp4", sessionId: "", date: "12/06", rawDate: "2026-06-12", executionStatus: "realizada", developmentLevel: "intermediario" },
        { id: "mp5", sessionId: "", date: "26/06", rawDate: "2026-06-26", executionStatus: "realizada", developmentLevel: "intermediario" },
      ],
    },
  ];
}

/**
 * Loads a student's per-exercise motor progress (computed in the database).
 *
 * @param options - Pass `{ mock: true }` (tutorial only) for seeded progress.
 */
export function useExerciseProgress(studentId: string, options?: { mock?: boolean }) {
  const isMock = options?.mock ?? false;
  const { t } = useI18n();
  const [exercises, setExercises] = useState<ExerciseProgress[]>(isMock ? buildMockExerciseProgress(t) : []);
  const [isLoading, setIsLoading] = useState(!isMock);
  const [error, setError] = useState<Error | null>(null);

  async function fetchProgress() {
    if (isMock) {
      setExercises(buildMockExerciseProgress(t));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("rpc_get_progresso_exercicios", {
      p_aluno_id: studentId,
    });

    if (rpcError) {
      setError(rpcError instanceof Error ? rpcError : new Error(String(rpcError)));
      setExercises([]);
      setIsLoading(false);
      return;
    }

    const rawData = (data as any[]) || [];

    const mappedExercises: ExerciseProgress[] = rawData.map((item: any) => {
      const evolution = mapEvolution(item.evolucao, t);
      const historico = (item.historico || []) as any[];

      const records: ExerciseProgressRecord[] = historico.map((record: any, index: number) => {
        const recordDate = new Date(record.data);
        return {
          id: `${item.exercicio_id}-${index}-${record.data}`,
          sessionId: "",
          date: `${String(recordDate.getDate()).padStart(2, "0")}/${String(recordDate.getMonth() + 1).padStart(2, "0")}`,
          rawDate: record.data.split("T")[0],
          executionStatus: "realizada",
          developmentLevel: mapDevelopmentLevel(record.nivel_desenvolvimento),
        };
      });

      const ultimoNivel = [...historico]
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        .map((r) => r.nivel_desenvolvimento)
        .filter((n) => n != null)
        .pop() ?? null;
      const desempenho = mapLastPerformance(ultimoNivel, t);

      return {
        id: item.exercicio_id,
        title: item.nome,
        statusLabel: desempenho.label,
        statusTone: desempenho.tone,
        sessions: item.total_sessoes,
        evolutionLabel: evolution.label,
        evolutionTone: evolution.tone,
        records,
      };
    });

    setExercises(mappedExercises);
    setIsLoading(false);
  }

  useEffect(() => {
    if (isMock || studentId) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, isMock]);

  return {
    exercises,
    isLoading,
    error,
    refetch: fetchProgress,
  };
}

/** Maps a development level to the "last performance" label and tone. */
function mapLastPerformance(
  nivel: string | null,
  t: Translate,
): { label: string; tone: "green" | "yellow" | "red" | "gray" } {
  switch (nivel) {
    case "maduro":
    case "alto":
      return { label: t("analysis.level.maduro"), tone: "green" };
    case "intermediario":
    case "medio":
      return { label: t("analysis.level.intermediario"), tone: "yellow" };
    case "inicial":
      return { label: t("analysis.level.inicial"), tone: "red" };
    default:
      return { label: t("analysis.status.notFilled"), tone: "gray" };
  }
}

/** Maps a database development-level enum to the chart's level union. */
function mapDevelopmentLevel(level: string): "inicial" | "intermediario" | "maduro" {
  switch (level) {
    case "maduro":
    case "alto":
      return "maduro";
    case "intermediario":
    case "medio":
      return "intermediario";
    default:
      return "inicial";
  }
}

/** Maps an evolution label to its display label and tone. */
function mapEvolution(evolucao: string, t: Translate): { label: string; tone: "green" | "yellow" | "red" | "gray" } {
  switch (evolucao) {
    case "Melhorou":
      return { label: t("analysis.evolution.improved"), tone: "green" };
    case "Estável":
      return { label: t("analysis.evolution.stable"), tone: "yellow" };
    case "Precisa reforço":
      return { label: t("analysis.evolution.needsReinforcement"), tone: "red" };
    case "Aguardando novos registros":
    default:
      return { label: t("analysis.progress.awaiting"), tone: "gray" };
  }
}