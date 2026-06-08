import React, { useMemo } from "react";
import { useLocalSearchParams, router } from "expo-router";

import {
  CircuitSelectionScreen,
  CircuitItem,
} from "../features/sessions/screens/circuit-selection-screen";
import { useCircuits } from "../features/exercises/hooks/use-circuits";

// Entradas fixas de formulário, mantidas junto dos circuitos reais.
const FORM_ITEMS: CircuitItem[] = [
  { id: "ata", name: "Formulário ATA", description: "", type: "ata" },
  { id: "cars", name: "Formulário CARS", description: "", type: "cars" },
];

export default function CircuitSelectionRoute() {
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
  }>();

  const { circuits } = useCircuits();

  // Circuitos reais da equipe + entradas de formulário (ATA/CARS).
  const items: CircuitItem[] = useMemo(() => {
    const real: CircuitItem[] = circuits.map((c) => ({
      id: c.id,
      name: c.name,
      description:
        c.exercisesCount > 0
          ? `${c.exercisesCount} exercícios - ${c.exercisesSummary}`
          : "Sem exercícios vinculados",
      type: c.executionMode === "livre" ? "livre" : "estruturado",
      exercises: c.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
      })),
    }));
    return [...real, ...FORM_ITEMS];
  }, [circuits]);

  return (
    <CircuitSelectionScreen
      studentName={studentName || "Aluno"}
      circuits={items}
      onPressBack={() => router.back()}
      onPressCircuit={(circuit: CircuitItem) => {
        const exercisesParam = JSON.stringify(circuit.exercises ?? []);
        const baseParams = {
          studentName,
          studentId: studentId ?? "",
          circuitId: circuit.id,
          circuitName: circuit.name,
          exercises: exercisesParam,
        };

        if (circuit.type === "livre") {
          router.push({ pathname: "/session/semi-structured", params: baseParams });
        } else if (circuit.type === "estruturado") {
          router.push({ pathname: "/session/structured", params: baseParams });
        } else if (circuit.type === "ata" || circuit.type === "cars") {
          router.push({
            pathname: "/form",
            params: {
              studentName,
              studentId: studentId ?? "",
              circuitType: circuit.type,
              circuitName: circuit.name,
            },
          });
        }
      }}
    />
  );
}
