import React from "react";
import { useLocalSearchParams } from "expo-router";

import { SessionDetailScreen } from "../../../features/sessions/screens/session-detail-screen";

export default function SessionDetailRoute() {
  const { sessionId, studentName } = useLocalSearchParams<{
    sessionId: string;
    studentName?: string;
  }>();

  return (
    <SessionDetailScreen
      sessionId={sessionId as string}
      studentName={studentName || "Aluno"}
    />
  );
}
