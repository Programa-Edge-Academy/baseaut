import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Toast, type ToastMode } from "@/components/toast";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Mabc2Record, Mabc2RecordCard } from "../components/mabc2-record-card";

export type Mabc2RecordsListScreenProps = {
  studentName: string;
  records: Mabc2Record[];
  isLoading?: boolean;
  onRefresh?: () => void;
  toastConfig?: { visible: boolean; mode: ToastMode; title: string; description?: string };
  onHideToast?: () => void;
  onPressBack?: () => void;
  onPressNewRecord?: () => void;
  onPressRecord?: (record: Mabc2Record) => void;
};

export function Mabc2RecordsListScreen({
  studentName,
  records,
  isLoading = false,
  onRefresh,
  toastConfig,
  onHideToast,
  onPressBack,
  onPressNewRecord,
  onPressRecord,
}: Mabc2RecordsListScreenProps) {
  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-5 mt-5">
        <PageHeader
          mode="exercicios"
          title={`MABC-2 — ${studentName}`}
          subtitle="Registros de avaliação motora"
          onNewPress={onPressNewRecord}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DataList
          className="mx-5 mt-3"
          data={records}
          emptyMessage="Nenhum registro MABC-2 encontrado."
          onRefresh={onRefresh}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Mabc2RecordCard
              record={item}
              onPress={() => onPressRecord?.(item)}
            />
          )}
        />
      )}

      {toastConfig && (
        <Toast
          visible={toastConfig.visible}
          mode={toastConfig.mode}
          title={toastConfig.title}
          description={toastConfig.description}
          onHide={onHideToast}
        />
      )}
    </View>
  );
}