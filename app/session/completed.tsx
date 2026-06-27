import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SessionCompletedScreen } from "@/features/sessions/screens/session-completed-screen";

/**
 * Route for the session-completed hub, reading the completion context from the
 * route params and forwarding it to the completion screen.
 */
export default function SessionCompletedHubRoute() {
  const {
    type,
    studentName,
    queue,
    fullCircuit,
    studentId,
    sessionId,
    attempted,
    realized,
  } = useLocalSearchParams<{
    type: string;
    studentName: string;
    queue: string;
    fullCircuit: string;
    studentId: string;
    sessionId: string;
    attempted: string;
    realized: string;
  }>();

  return (
    <SessionCompletedScreen
      type={type || "structured"}
      studentName={studentName || "Aluno"}
      queue={queue}
      fullCircuit={fullCircuit}
      studentId={studentId}
      sessionId={sessionId}
      attempted={attempted}
      realized={realized}
    />
  );
}