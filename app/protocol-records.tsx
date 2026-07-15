import React from "react";
import { router, useLocalSearchParams } from "expo-router";

import { ProtocolRecordsListScreen } from "@/features/analysis/screens/protocol-records-list-screen";
import type { ProtocolTipo } from "@/features/analysis/hooks/use-protocol-records";
import { useI18n } from "@/features/settings/contexts/i18n-context";

/**
 * Route listing a student's protocol records of a given type, navigating to the
 * protocol view on selection.
 */
export default function ProtocolRecordsRoute() {
  const { t } = useI18n();
  const { studentId, studentName, tipo } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
    tipo: ProtocolTipo;
  }>();

  const protocolTipo = (tipo as ProtocolTipo) || "ata";

  return (
    <ProtocolRecordsListScreen
      studentId={(studentId as string) || ""}
      studentName={studentName || t("common.student")}
      tipo={protocolTipo}
      onPressBack={() => router.back()}
      onPressRecord={(record) =>
        router.push({
          pathname: "/protocol-view",
          params: {
            studentId: studentId ?? "",
            studentName: studentName ?? "",
            tipo: protocolTipo,
            recordId: record.id,
            label: record.label,
            dateLabel: record.dateLabel,
            scoreLabel: record.scoreLabel ?? "",
          },
        })
      }
    />
  );
}
