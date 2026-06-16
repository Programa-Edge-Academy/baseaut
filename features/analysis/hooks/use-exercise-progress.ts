import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { ExerciseProgressRecord } from "../components/exercise-progress-chart";

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

export function useExerciseProgress(studentId: string) {
  const [exercises, setExercises] = useState<ExerciseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchProgress() {
    setIsLoading(true);

    // Chama a RPC criada na migration para buscar e processar a evolução motora direto no banco de dados Supabase
    const { data, error } = await supabase.rpc("rpc_get_progresso_exercicios", {
      p_aluno_id: studentId,
    });

    if (error) {
      console.error("Erro ao buscar progresso:", error);
      setIsLoading(false);
      return;
    }

    const rawData = (data as any[]) || [];

    const mappedExercises: ExerciseProgress[] = rawData.map((item: any) => {
      const evolution = mapEvolution(item.evolucao);
      
      const records: ExerciseProgressRecord[] = (item.historico || []).map((record: any, index: number) => {
        const recordDate = new Date(record.data);
        return {
          id: `${item.exercicio_id}-${index}-${record.data}`,
          sessionId: "", // RPC não retorna o ID da sessão
          date: `${String(recordDate.getDate()).padStart(2, "0")}/${String(recordDate.getMonth() + 1).padStart(2, "0")}`,
          rawDate: record.data.split("T")[0],
          executionStatus: "realizada",
          developmentLevel: mapDevelopmentLevel(record.nivel_desenvolvimento),
        };
      });

      return {
        id: item.exercicio_id,
        title: item.nome,
        statusLabel: "Realizado",
        statusTone: "green",
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
    if (studentId) {
      fetchProgress();
    }
  }, [studentId]);

  return {
    exercises,
    isLoading,
  };
}

// ==================== AUXILIARES DE MAPEAMENTO DE ENUMS ====================

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

function mapEvolution(evolucao: string): { label: string; tone: "green" | "yellow" | "red" | "gray" } {
  switch (evolucao) {
    case "Melhorou":
      return { label: "Melhorou", tone: "green" };
    case "Estável":
      return { label: "Estável", tone: "yellow" };
    case "Precisa reforço":
      return { label: "Precisa reforço", tone: "red" };
    case "Aguardando novos registros":
    default:
      return { label: "Aguardando novos registros", tone: "gray" };
  }
}