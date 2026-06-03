import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Mabc2Record, Mabc2RecordCard } from "../components/mabc2-record-card";

export type Mabc2RecordsListScreenProps = {
  studentName: string;
  records: Mabc2Record[];
  isLoading?: boolean;
  onPressBack?: () => void;
  onPressNewRecord?: () => void;
  onPressRecord?: (record: Mabc2Record) => void;
};

export function Mabc2RecordsListScreen({
  studentName,
  records,
  isLoading = false,
  onPressBack,
  onPressNewRecord,
  onPressRecord,
}: Mabc2RecordsListScreenProps) {
  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-5 mt-5">
        <PageHeader
          title={`MABC-2 — ${studentName}`}
          subtitle="Registros de avaliação motora"
        />
      </View>

      <View className="items-center mt-4 mb-2">
        <DefaultButton
          label="+ Novo Registro"
          onPress={onPressNewRecord}
          bgColorClass="bg-primary"
          shadowClass="shadow-primaryShadow"
          sizeClass="w-[210px] h-11"
          textClassName="text-white"
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Mabc2RecordCard
              record={item}
              onPress={() => onPressRecord?.(item)}
            />
          )}
        />
      )}
    </View>
  );
}