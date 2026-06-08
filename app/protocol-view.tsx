import React from "react";
import { router, useLocalSearchParams } from "expo-router";

import { ProtocolVisualizationScreen } from "@/features/analysis/screens/protocol-visualization-screen";
import type { ProtocolTipo } from "@/features/analysis/hooks/use-protocol-records";

export default function ProtocolViewRoute() {
  const { studentName, tipo, recordId, label, dateLabel, scoreLabel } =
    useLocalSearchParams<{
      studentName: string;
      tipo: ProtocolTipo;
      recordId: string;
      label: string;
      dateLabel: string;
      scoreLabel: string;
    }>();

  return (
    <ProtocolVisualizationScreen
      tipo={(tipo as ProtocolTipo) || "ata"}
      recordId={(recordId as string) || ""}
      studentName={studentName || "Aluno"}
      label={label}
      dateLabel={dateLabel}
      scoreLabel={scoreLabel || null}
      onPressBack={() => router.back()}
    />
  );
}
