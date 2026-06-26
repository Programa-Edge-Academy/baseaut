import React, { useMemo } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { SessionRunningScreen } from "../../features/sessions/screens/session-running-screen";
import type { SessionExercise } from "../../features/sessions/screens/session-running-screen";

/**
 * Route for a structured (circuit) session run. Deserializes the selected
 * circuit's exercises from the route params and wires completion navigation to
 * the session-completed hub.
 */
export default function SessionEstruturadoRoute() {
  const {
    studentName,
    circuitName,
    circuitId,
    circuitType,
    sessionId,
    studentId,
    exercises,
  } = useLocalSearchParams<any>();

  const sessionExercises = useMemo<SessionExercise[] | undefined>(() => {
    if (!exercises) return undefined;
    try {
      const parsed = JSON.parse(exercises) as {
        id: string;
        name: string;
        description: string;
        iconUrl?: string | null;
      }[];
      return parsed.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        mediaUrls: [],
        iconUrl: e.iconUrl ?? null,
      }));
    } catch {
      return undefined;
    }
  }, [exercises]);

  return (
    <SessionRunningScreen
      sessionId={sessionId || ""}
      studentId={studentId || ""}
      circuitId={circuitId || ""}
      studentName={studentName || "Aluno"}
      circuitName={circuitName || "Circuito"}
      circuitType={(circuitType as any) || "padrao"}
      exercises={sessionExercises ?? []}
      onPressBack={() => router.back()}
      onCompleteSession={(hasWarnings, pendentes, todos, completedSessionId) => {
        router.push({
          pathname: "/session/completed",
          params: {
            type: hasWarnings ? "structured-warnings" : "structured",
            studentName,
            studentId: studentId || "",
            sessionId: completedSessionId || sessionId || "",
            queue: JSON.stringify(pendentes || []),
            fullCircuit: JSON.stringify(todos || []),
          },
        });
      }}
    />
  );
}
