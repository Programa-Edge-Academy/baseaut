import React from "react";
import { router, useLocalSearchParams } from "expo-router";

import { ProtocolVisualizationScreen } from "@/features/analysis/screens/protocol-visualization-screen";
import type { ProtocolTipo } from "@/features/analysis/hooks/use-protocol-records";
import { useI18n } from "@/features/settings/contexts/i18n-context";

/**
 * Route for viewing a single protocol record (ATA, CARS, etc.). Reads the
 * record identifiers from the route params and forwards them to the
 * visualization screen.
 */
export default function ProtocolViewRoute() {
  const { t } = useI18n();
  const { studentId, studentName, tipo, recordId, label, dateLabel, scoreLabel } =
    useLocalSearchParams<{
      studentId: string;
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
      studentId={(studentId as string) || ""}
      studentName={studentName || t("common.student")}
      label={label}
      dateLabel={dateLabel}
      scoreLabel={scoreLabel || null}
      onPressBack={() => router.back()}
    />
  );
}
