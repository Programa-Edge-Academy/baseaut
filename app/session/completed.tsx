import React from "react";
import { useLocalSearchParams } from "expo-router";

import { SessionCompletedFreeScreen } from "../../features/sessions/screens/session-completed-free-screen";
import { SessionCompletedStructuredScreen } from "../../features/sessions/screens/session-completed-structured-screen";
import { SessionCompletedStructuredContinuationScreen } from "../../features/sessions/screens/session-completed-structured-continuation-screen";
import { SessionCompletedStructuredWarningsScreen } from "../../features/sessions/screens/session-completed-structured-warning-screen";

export default function SessionCompletedHubRoute() {
  const { type } = useLocalSearchParams<{ type: string }>();

  switch (type) {
    case "free":
      return <SessionCompletedFreeScreen />;
    case "structured":
      return <SessionCompletedStructuredScreen />;
    case "structured-continuation":
      return <SessionCompletedStructuredContinuationScreen />; //zombie code?
    case "structured-warnings":
      return <SessionCompletedStructuredWarningsScreen />;
    default:
      return <SessionCompletedStructuredScreen />;
  }
}