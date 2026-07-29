import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { AnalysisSummaryCard, AnalysisSummaryCardProps } from "./analysis-summary-card";

/** Builds the fallback summary cards using the active locale. */
function buildDefaultCards(
  t: (key: TranslationKey) => string,
): AnalysisSummaryCardProps[] {
  const p1 = t("analysis.period1");
  const p2 = t("analysis.period2");
  return [
    {
      title: t("analysis.summary.exercisesEvaluated"),
      period1: { label: p1, value: 6 },
      period2: { label: p2, value: 8 },
    },
    {
      title: t("analysis.summary.helpRecords"),
      period1: { label: p1, value: 14 },
      period2: { label: p2, value: 9 },
    },
    {
      title: t("analysis.summary.behaviors"),
      period1: { label: p1, value: 7 },
      period2: { label: p2, value: 7 },
    },
    {
      title: t("analysis.summary.sessions"),
      period1: { label: p1, value: 3 },
      period2: { label: p2, value: 4 },
    },
  ];
}

/** Props for {@link AnalysisSummary}. */
export type AnalysisSummaryProps = {
  title?: string;
  cards?: AnalysisSummaryCardProps[];
  showNote?: boolean;
};

/**
 * Comparison summary panel listing per-metric cards for two periods, with an
 * optional explanatory footer note.
 */
export function AnalysisSummary({
  title,
  cards,
  showNote = true,
}: AnalysisSummaryProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("analysis.summary.title");
  const resolvedCards = cards ?? buildDefaultCards(t);
  return (
    <View
      style={{
        backgroundColor: colors.level2,
        borderWidth: 1,
        borderColor: colors.outline,
      }}
      className="w-full rounded-2xl p-6"
    >
      <View className="flex-col gap-3">
        <Text className="text-content text-[20px] font-bold mb-1">
          {resolvedTitle}
        </Text>

        <View className="gap-3">
          {resolvedCards.map((card, index) => (
            <AnalysisSummaryCard key={index} {...card} />
          ))}
        </View>

        {showNote && (
          <View className="mt-2 flex-row items-start">
            <AlertCircle
              size={22}
              color={colors.muted}
              strokeWidth={2}
            />
            <Text
              className="text-muted text-xs ml-3"
              style={{
                flex: 1,
                lineHeight: 20,
              }}
            >
              {t("analysis.summary.note")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default AnalysisSummary;