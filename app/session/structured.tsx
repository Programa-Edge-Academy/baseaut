import React from "react";
import { useLocalSearchParams, router } from "expo-router";
import { SessionRunningScreen } from "../../features/sessions/screens/session-running-screen";

export default function SessionEstruturadoRoute() {
  const { studentName, circuitName, sessionId, studentId } = useLocalSearchParams<any>();

  return (
    <SessionRunningScreen 
      sessionId={sessionId || ""}
      studentId={studentId || ""}
      studentName={studentName || "Aluno"}
      circuitName={circuitName || "Circuito"}
      circuitType={"estruturado" as any}
      onPressBack={() => router.back()}
      
      onCompleteSession={(hasWarnings, pendentes, todos) => {
        router.push({
          pathname: "/session/completed",
          params: { 
            type: hasWarnings ? "structured-warnings" : "structured",
            studentName,
            queue: JSON.stringify(pendentes || []),
            fullCircuit: JSON.stringify(todos || [])
          }
        });
      }}

      onFinishSession={(motivo) => {
        console.log("Sessão finalizada antecipadamente por motivo:", motivo);
      }}
    />
  );
}