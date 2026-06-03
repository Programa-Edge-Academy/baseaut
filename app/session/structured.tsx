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
      circuitType={"estruturado" as any} // Ficar de olho caso dê erro futurametne, será removido quando integrarmos com o backend
      onPressBack={() => router.back()}
      
      onCompleteSession={(hasWarnings) => {
        router.push({
          pathname: "/session/completed",
          params: { 
            type: hasWarnings ? "structured-warnings" : "structured",
            studentName 
          }
        });
      }}

      // 👇 QUANDO FINALIZAR ANTES DA HORA (Falta de exercícios): Vai para a de continuação
      onFinishSession={(motivo) => {
        console.log("Sessão finalizada antecipadamente por motivo:", motivo);
        router.push({
          pathname: "/session/completed",
          params: { type: "structured-continuation", studentName }
        });
      }}
    />
  );
}