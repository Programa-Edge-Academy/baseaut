import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import { type ToastMode } from "@/components/toast";
import { useMabc2Records } from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordsListScreen } from "@/features/analysis/screens/mabc2-records-list-screen";

export default function Mabc2RecordsRoute() {
  const { studentId, studentName, toastSuccess } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
    toastSuccess?: string;
  }>();

  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? "Aluno";
  const { records, isLoading, refetch, error } = useMabc2Records(currentStudentId);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    mode: ToastMode;
    title: string;
    description?: string;
  }>({
    visible: false,
    mode: "success",
    title: "",
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    if (toastSuccess) {
      setToastConfig({
        visible: true,
        mode: "success",
        title: toastSuccess,
      });
    }
  }, [toastSuccess]);

  useEffect(() => {
    if (error) {
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Não foi possível carregar os dados de desenvolvimento motor.",
        description: "Tente novamente",
      });
    }
  }, [error]);

  return (
    <Mabc2RecordsListScreen
      studentName={currentStudentName}
      records={records}
      isLoading={isLoading}
      toastConfig={toastConfig}
      onHideToast={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
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