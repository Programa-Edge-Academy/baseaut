import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionRunningSemiStructuredScreen } from "../../features/sessions/screens/session-running-semi-structured-screen";
import type { SessionExercise } from "../../features/sessions/screens/session-running-screen";

export default function SessionLivreRoute() {
  const { queue, studentName } = useLocalSearchParams<{ queue: string; studentName: string }>();

  const exercises: SessionExercise[] = queue ? JSON.parse(queue) : [];

  return (
    <SessionRunningSemiStructuredScreen
      exercises={exercises}
      studentName={studentName || "Aluno"}
    />
  );
}