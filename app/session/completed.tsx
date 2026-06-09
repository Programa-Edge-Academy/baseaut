import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionCompletedScreen } from "@/features/sessions/screens/session-completed-screen";

export default function SessionCompletedHubRoute() {
  const { type, studentName, queue, fullCircuit, studentId, sessionId } =
    useLocalSearchParams<{
      type: string;
      studentName: string;
      queue: string;
      fullCircuit: string;
      studentId: string;
      sessionId: string;
    }>();

  return (
    <SessionCompletedScreen
      type={type || "structured"}
      studentName={studentName || "Aluno"}
      queue={queue}
      fullCircuit={fullCircuit}
      studentId={studentId}
      sessionId={sessionId}
    />
  );
}