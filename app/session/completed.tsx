import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

import { SessionCompletedFreeScreen } from "../../features/sessions/screens/session-completed-free-screen";
import { SessionCompletedStructuredScreen } from "../../features/sessions/screens/session-completed-structured-screen";
import { SessionCompletedStructuredContinuationScreen } from "../../features/sessions/screens/session-completed-structured-continuation-screen";
import { SessionCompletedStructuredWarningsScreen } from "../../features/sessions/screens/session-completed-structured-warning-screen";
import { useSessionResult } from "../../features/sessions/hooks/use-session-result";

export default function SessionCompletedHubRoute() {
  const { type, sessaoId, studentName, circuitName, executionMode } =
    useLocalSearchParams<{
      type?: string;
      sessaoId?: string;
      studentName?: string;
      circuitName?: string;
      executionMode?: string;
    }>();

  // Reads the persisted session so the summary reflects the real counts.
  const { summary } = useSessionResult(sessaoId || null);

  const modeLabel = executionMode === "livre" ? "Livre" : "Estruturado";

  const sharedProps = useMemo(
    () => ({
      studentName: studentName || "Aluno",
      circuitName: circuitName || "Circuito",
      modeLabel,
      statusLabel: type === "free" ? "" : "Realizadas",
      progress:
        type === "free"
          ? `${summary.realizedCount} atividades realizadas`
          : `${summary.realizedCount}/${summary.total}`,
      unrealizedCount: summary.unrealizedCount,
    }),
    [studentName, circuitName, modeLabel, type, summary],
  );

  switch (type) {
    case "free":
      return <SessionCompletedFreeScreen {...sharedProps} />;
    case "structured":
      return <SessionCompletedStructuredScreen {...sharedProps} />;
    case "structured-continuation":
      return <SessionCompletedStructuredContinuationScreen {...sharedProps} />;
    case "structured-warnings":
      return <SessionCompletedStructuredWarningsScreen {...sharedProps} />;
    default:
      return <SessionCompletedStructuredScreen {...sharedProps} />;
  }
}
