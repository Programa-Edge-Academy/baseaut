import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionRunningSemiStructuredScreen } from "../../features/sessions/screens/session-running-semi-structured-screen";
import type { SessionExercise } from "../../features/sessions/screens/session-running-screen";

export default function SessionSemiStructuredRoute() {
  const {
    exercises,
    queue,
    studentName,
    studentId,
    sessionId,
    circuitId,
    circuitName,
  } = useLocalSearchParams<any>();

  // Início do circuito semi-estruturado envia "exercises"; retomada (tela de
  // conclusão) envia "queue". Aceitamos ambos para evitar a lista vazia.
  const sessionExercises = useMemo<SessionExercise[]>(() => {
    const raw = exercises ?? queue;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as {
        id: string;
        name: string;
        description?: string;
      }[];
      return parsed.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description ?? "",
        mediaUrls: [],
      }));
    } catch {
      return [];
    }
  }, [exercises, queue]);

  return (
    <SessionRunningSemiStructuredScreen
      exercises={sessionExercises}
      studentName={studentName || "Aluno"}
      studentId={studentId || ""}
      sessionId={sessionId || ""}
      circuitId={circuitId || ""}
      circuitName={circuitName || "Circuito"}
    />
  );
}
