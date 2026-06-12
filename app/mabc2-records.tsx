import { router, useLocalSearchParams } from "expo-router";
import React from "react";

import { useMabc2Records } from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordsListScreen } from "@/features/analysis/screens/mabc2-records-list-screen";

export default function Mabc2RecordsRoute() {
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
  }>();

  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? "Aluno";
  const { records, isLoading } = useMabc2Records(currentStudentId);

  return (
    <Mabc2RecordsListScreen
      studentName={currentStudentName}
      records={records}
      isLoading={isLoading}
      onPressBack={() => router.back()}
      onPressNewRecord={() =>
        router.push({
          pathname: "/mabc2-record-form",
          params: {
            mode: "create",
            studentId: currentStudentId,
            studentName: currentStudentName,
          },
        } as any)
      }
      onPressRecord={(record) =>
        router.push({
          pathname: "/mabc2-record-form",
          params: {
            mode: "view",
            studentId: currentStudentId,
            studentName: currentStudentName,
            recordId: record.id,
          },
        } as any)
      }
    />
  );
}
