import { colors } from "@/assets/colors";
import { ClipboardList } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import type { ProtocolRecord } from "../hooks/use-protocol-records";

export type ProtocolRecordCardProps = {
  record: ProtocolRecord;
  showAgeGroup?: boolean;
  onPress?: () => void;
};

/** Read-only summary card for a saved protocol record (ATA/CARS/MABC-2). */
export function ProtocolRecordCard({
  record,
  showAgeGroup = false,
  onPress,
}: ProtocolRecordCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full flex-row items-center gap-4 rounded-2xl border border-outline bg-level2 p-4 mb-4 active:opacity-80"
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${colors.primary}26` }}
      >
        <ClipboardList size={22} color={colors.primary} />
      </View>

      <View className="flex-1">
        <Text className="text-base font-bold text-white" numberOfLines={1}>
          {record.label}
        </Text>

        <Text className="mt-1 text-sm text-muted">
          Registro: <Text className="text-white font-medium">{record.dateLabel}</Text>
        </Text>

        {showAgeGroup && record.ageGroupLabel ? (
          <Text className="mt-1 text-sm text-muted">
            Grupo de idade:{" "}
            <Text className="text-white font-medium">{record.ageGroupLabel}</Text>
          </Text>
        ) : (
          <Text className="mt-1 text-sm text-muted">
            Pontuação total:{" "}
            <Text className="text-white font-medium">
              {record.scoreLabel ?? "—"}
            </Text>
          </Text>
        )}

        <Text className="mt-1 text-sm text-muted">
          Avaliado por:{" "}
          <Text className="text-white font-medium">
            {record.evaluatorName ?? "—"}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}
