import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { ProtocolEmptyState } from "../components/protocol-empty-state";
import { ProtocolRecordCard } from "../components/protocol-record-card";
import {
  useProtocolRecords,
  type ProtocolRecord,
  type ProtocolTipo,
} from "../hooks/use-protocol-records";

const PROTOCOL_LABELS: Record<ProtocolTipo, string> = {
  ata: "ATA",
  cars: "CARS",
  mabc2: "MABC-2",
};

export type ProtocolRecordsListScreenProps = {
  studentId: string;
  studentName: string;
  tipo: ProtocolTipo;
  onPressBack?: () => void;
  onPressRecord?: (record: ProtocolRecord) => void;
};

export function ProtocolRecordsListScreen({
  studentId,
  studentName,
  tipo,
  onPressBack,
  onPressRecord,
}: ProtocolRecordsListScreenProps) {
  const { records, isLoading, error, refetch } = useProtocolRecords(studentId, tipo);
  const protocolLabel = PROTOCOL_LABELS[tipo];

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="flex-1">
        <View className="mx-8 mt-5">
          <PageHeader
            title={`${protocolLabel} - ${studentName}`}
            subtitle={
              records.length > 0
                ? `${records.length} ${records.length === 1 ? "registro" : "registros"}`
                : "Visualização de registros"
            }
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View className="mt-16 items-center px-8">
            <Text className="text-center text-default-2 text-extra">
              Não foi possível carregar os protocolos/testes aplicados. Tente
              novamente.
            </Text>
          </View>
        ) : records.length === 0 ? (
          <ProtocolEmptyState />
        ) : (
          <DataList
            className="mx-8 mt-5"
            data={records}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum registro encontrado."
            onRefresh={refetch}
            renderItem={({ item }) => (
              <ProtocolRecordCard
                record={item}
                showAgeGroup={tipo === "mabc2"}
                onPress={() => onPressRecord?.(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
