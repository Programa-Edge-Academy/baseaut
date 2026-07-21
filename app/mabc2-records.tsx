import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/assets/colors";
import { type ToastMode } from "@/components/toast";
import { useMabc2Records } from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordsListScreen } from "@/features/analysis/screens/mabc2-records-list-screen";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";

/**
 * Route listing a student's MABC-2 records. Guards access to coordinators and
 * monitors, surfaces load/success toasts, and navigates to the record form for
 * creating or viewing records.
 */
export default function Mabc2RecordsRoute() {
  const { studentId, studentName, toastSuccess } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
    toastSuccess?: string;
  }>();

  const { t } = useI18n();
  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? t("common.student");
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const { records, isLoading, refetch, error } = useMabc2Records(currentStudentId, { mock: isTutorial });

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
        title: t("analysis.motorLoadError"),
        description: t("common.retry"),
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-level1">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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