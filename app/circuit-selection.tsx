import React, { useMemo } from "react";
import { useLocalSearchParams, router } from "expo-router";

import {
  CircuitSelectionScreen,
  CircuitItem,
} from "../features/sessions/screens/circuit-selection-screen";
import { useCircuits } from "../features/exercises/hooks/use-circuits";

export default function CircuitSelectionRoute() {
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
  }>();

  const { circuits, isLoading } = useCircuits();

  // Maps the DB circuit model to the list item the screen renders, carrying the
  // linked exercises so the running session can be seeded without an extra read.
  const items: CircuitItem[] = useMemo(
    () =>
      circuits.map((circuit) => ({
        id: circuit.id,
        name: circuit.name,
        description:
          circuit.exercisesCount > 0
            ? `${circuit.exercisesCount} exercícios - ${circuit.exercisesSummary}`
            : "Sem exercícios vinculados",
        type: circuit.executionMode === "livre" ? "livre" : "estruturado",
        exercises: circuit.exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          description: exercise.description,
        })),
        formId: circuit.formId,
      })),
    [circuits],
  );

  return (
    <CircuitSelectionScreen
      studentName={studentName || "Aluno"}
      circuits={items}
      isLoading={isLoading}
      onPressBack={() => router.back()}
      onPressCircuit={(circuit: CircuitItem) => {
        const params = {
          studentId: studentId ?? "",
          studentName: studentName ?? "",
          circuitId: circuit.id,
          circuitName: circuit.name,
          executionMode: circuit.type,
          exercises: JSON.stringify(circuit.exercises ?? []),
        };

        router.push({
          pathname:
            circuit.type === "livre" ? "/session/free" : "/session/structured",
          params,
        });
      }}
    />
  );
}
