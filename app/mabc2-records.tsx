import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/assets/colors";
import { type ToastMode } from "@/components/toast";
import { useMabc2Records } from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordsListScreen } from "@/features/analysis/screens/mabc2-records-list-screen";
import { supabase } from "@/lib/supabase";

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

  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? "Aluno";
  const { records, isLoading, refetch, error } = useMabc2Records(currentStudentId);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

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

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAuthorized(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("perfis")
          .select("perfil")
          .eq("id", user.id)
          .single();

        const role = profileData?.perfil || user.user_metadata?.perfil || user.user_metadata?.role;

        if (role === "coordenador" || role === "monitor") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAuthorized === false) {
      router.back();
    }
  }, [isAuthorized]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthorized) {
        refetch();
      }
    }, [refetch, isAuthorized])
  );

  useEffect(() => {
    if (toastSuccess && isAuthorized) {
      setToastConfig({
        visible: true,
        mode: "success",
        title: toastSuccess,
      });
    }
  }, [toastSuccess, isAuthorized]);

  useEffect(() => {
    if (error && isAuthorized) {
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Não foi possível carregar os dados de desenvolvimento motor.",
        description: "Tente novamente",
      });
    }
  }, [error, isAuthorized]);

  if (isAuthorized === null || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-level1">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthorized === false) {
    return null;
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