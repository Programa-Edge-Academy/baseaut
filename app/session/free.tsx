import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

import {
  SessionRunningFreeScreen,
  type FreeSessionExercise,
} from "../../features/sessions/screens/session-running-free-screen";

export default function SessionLivreRoute() {
  // Manages the free listing of exercises and the yellow engagement button.
  const { studentName, circuitName, exercises } = useLocalSearchParams<{
    studentName?: string;
    circuitName?: string;
    exercises?: string;
  }>();

  const parsedExercises = useMemo<FreeSessionExercise[]>(() => {
    try {
      const parsed = JSON.parse(exercises ?? "[]") as {
        id: string;
        name: string;
        description: string;
      }[];
      return parsed.map((exercise) => ({
        id: exercise.id,
        title: exercise.name,
        description: exercise.description,
      }));
    } catch {
      return [];
    }
  }, [exercises]);

  return (
    <SessionRunningFreeScreen
      studentName={studentName || "Aluno"}
      circuitName={circuitName || "Circuito"}
      exercises={parsedExercises}
    />
  );
}
