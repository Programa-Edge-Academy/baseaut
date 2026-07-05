import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

/** Summary of a MABC-2 record shown in a list. */
export type Mabc2Record = {
  id: string;
  label: string;
  date: string;
  totalScore: number | null;
  totalPercentile: string | null;
};

/** Props for {@link Mabc2RecordCard}. */
export type Mabc2RecordCardProps = {
  record: Mabc2Record;
  onPress?: () => void;
};

/** Tappable list card summarizing a MABC-2 record's date and total scores. */
export function Mabc2RecordCard({ record, onPress }: Mabc2RecordCardProps) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      className="w-full rounded-xl border border-outline bg-level2 px-4 py-3 mb-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-bold text-content flex-1 pr-2" numberOfLines={1}>
          {record.label}
        </Text>
        <ChevronRight size={18} color={colors.muted} />
      </View>

      <Text className="text-sm font-medium text-muted mb-3">
        {record.date}
      </Text>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-sm font-medium text-muted">{t("analysis.mabc.totalScore")}</Text>
          <Text className="text-base font-bold text-content">
            {record.totalScore !== null ? String(record.totalScore) : "—"}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-muted">{t("analysis.mabc.totalPercentile")}</Text>
          <Text className="text-base font-bold text-content">
            {record.totalPercentile ?? "—"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}