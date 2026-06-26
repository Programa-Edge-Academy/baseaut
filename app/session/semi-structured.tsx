import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionRunningSemiStructuredScreen } from "../../features/sessions/screens/session-running-semi-structured-screen";
import type { SessionExercise } from "../../features/sessions/screens/session-running-screen";

/**
 * Route for a semi-structured session run. Accepts either an `exercises` param
 * (when starting) or a `queue` param (when resuming from the completion screen)
 * and normalizes both into the session exercise list.
 */
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

  const sessionExercises = useMemo<SessionExercise[]>(() => {
    const raw = exercises ?? queue;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as {
        id: string;
        name: string;
        description?: string;
        iconUrl?: string | null;
      }[];
      return parsed.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description ?? "",
        mediaUrls: [],
        iconUrl: e.iconUrl ?? null,
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
