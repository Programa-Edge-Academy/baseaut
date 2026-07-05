import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
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
  const { t } = useI18n();
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
        <Text className="text-base font-bold text-content" numberOfLines={1}>
          {record.label}
        </Text>

        <Text className="mt-1 text-sm text-muted">
          {t("analysis.protocolCard.record")}: <Text className="text-content font-medium">{record.dateLabel}</Text>
        </Text>

        {showAgeGroup && record.ageGroupLabel ? (
          <Text className="mt-1 text-sm text-muted">
            {t("analysis.protocolCard.ageGroup")}:{" "}
            <Text className="text-content font-medium">{record.ageGroupLabel}</Text>
          </Text>
        ) : (
          <Text className="mt-1 text-sm text-muted">
            {t("analysis.mabc.totalScore")}:{" "}
            <Text className="text-content font-medium">
              {record.scoreLabel ?? "—"}
            </Text>
          </Text>
        )}

        <Text className="mt-1 text-sm text-muted">
          {t("analysis.protocolCard.evaluatedBy")}:{" "}
          <Text className="text-content font-medium">
            {record.evaluatorName ?? "—"}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}
