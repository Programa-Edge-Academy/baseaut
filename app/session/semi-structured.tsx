import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionRunningSemiStructuredScreen } from "../../features/sessions/screens/session-running-semi-structured-screen";
import { SessionExercise } from "../../features/sessions/screens/session-running-screen";

// Mocks provisórios exclusivos para testar o circuito livre
const MOCK_LIVRE: SessionExercise[] = [
  { id: "livre-1", name: "Pular corda", description: "Pular corda por 1 minuto" },
  { id: "livre-2", name: "Corrida de obstáculos", description: "Fazer ziguezague entre os cones" },
  { id: "livre-3", name: "Pintura livre", description: "Usar tinta guache na cartolina" },
];

export default function SessionLivreRoute() {
  const { queue, studentName } = useLocalSearchParams<{ queue: string; studentName: string }>();

  // A Mágica: Se veio do "Tentar novamente/Repetir", usa a fila (queue). 
  // Se for a primeira vez abrindo o circuito, usa os MOCKS.
  const exercises = queue ? JSON.parse(queue) : MOCK_LIVRE;

  return (
    <SessionRunningSemiStructuredScreen 
      exercises={exercises}
      studentName={studentName || "Aluno"}
    />
  );
}