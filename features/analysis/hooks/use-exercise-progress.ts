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

    const { data, error } = await supabase
      .from("execucoes_exercicio")
      .select(`
        id,
        status_realizacao,
        nivel_desenvolvimento,
        created_at,
        exercicios (
          id,
          titulo
        ),
        sessoes!inner (
          id,
          aluno_id
        )
      `)
      .eq("sessoes.aluno_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar progresso:", error);
      setIsLoading(false);
      return;
    }

    const grouped = new Map<string, ExerciseProgress>();

    data.forEach((item: any) => {
      const exercise = item.exercicios;
      if (!exercise) return;

      const recordDate = new Date(item.created_at);
      
      // 🟢 CORREÇÃO DOS PARAMETROS: Adicionado o "|| """ para garantir que nunca vá undefined para as funções
      const formattedRecord: ExerciseProgressRecord = {
        id: item.id,
        sessionId: item.sessoes?.id,
        date: `${String(recordDate.getDate()).padStart(2, "0")}/${String(recordDate.getMonth() + 1).padStart(2, "0")}`,
        rawDate: item.created_at.split("T")[0],
        executionStatus: normalizeExecutionStatus(item.status_realizacao || ""),
        developmentLevel: mapDevelopmentLevel(item.nivel_desenvolvimento || ""),
      };

      if (!grouped.has(exercise.id)) {
        grouped.set(exercise.id, {
          id: exercise.id,
          title: exercise.titulo,
          statusLabel: mapStatus(item.status_realizacao || ""),
          statusTone: mapTone(item.status_realizacao || ""),
          sessions: 1,
          evolutionLabel: "Primeiro registro computado", 
          evolutionTone: "green",
          records: [formattedRecord],
        });
      } else {
        const current = grouped.get(exercise.id)!;
        
        const lastRecordInMap = current.records[0];
        
        current.sessions += 1;
        current.records.unshift(formattedRecord);

        if (current.sessions === 2 && lastRecordInMap) {
          const comparison = compareLevels(
            lastRecordInMap.developmentLevel as "inicial" | "intermediario" | "maduro", 
            formattedRecord.developmentLevel as "inicial" | "intermediario" | "maduro"
          );
          
          current.evolutionLabel = comparison.label;
          current.evolutionTone = comparison.tone;
        }
      }
    });

    setExercises(Array.from(grouped.values()));
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

function normalizeExecutionStatus(status: string): "realizada" | "nao_realizada" {
  if (status === "realizado" || status === "parcial") {
    return "realizada";
  }
  return "nao_realizada";
}

function mapStatus(status: string) {
  switch (status) {
    case "realizado": return "Realizado";
    case "parcial": return "Parcial";
    case "nao_realizado": return "Não realizado";
    default: return "Sem registro";
  }
}

function mapTone(status: string): "green" | "yellow" | "red" | "gray" {
  switch (status) {
    case "realizado": return "green";
    case "parcial": return "yellow";
    case "nao_realizado": return "red";
    default: return "gray";
  }
}

function mapDevelopmentLevel(level: string): "inicial" | "intermediario" | "maduro" {
  switch (level) {
    case "alto": return "maduro";
    case "medio": return "intermediario";
    default: return "inicial";
  }
}

function compareLevels(last: string, previous: string): { label: string; tone: "green" | "yellow" | "red" | "gray" } {
  const score = { inicial: 1, intermediario: 2, maduro: 3 };
  
  const lastScore = score[last as keyof typeof score] ?? 1;
  const previousScore = score[previous as keyof typeof score] ?? 1;

  if (lastScore > previousScore) {
    return { label: "Evolução detectada", tone: "green" };
  }
  if (lastScore < previousScore) {
    return { label: "Desempenho abaixo do anterior", tone: "red" };
  }
  return { label: "Desempenho estável", tone: "yellow" };
}