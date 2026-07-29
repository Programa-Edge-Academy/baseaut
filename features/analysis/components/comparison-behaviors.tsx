import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import ComparisonCard from "./comparison-card";

/** Counts of a behavior in each compared period. */
export interface BehaviorPeriodData {
  p1: number;
  p2: number;
  diferenca_absoluta?: number;
}

/** Props for {@link ComparisonBehaviors}. */
export type ComparisonBehaviorsProps = {
  data?: {
    estereotipia?: BehaviorPeriodData | null;
    contato_visual_pessoas?: BehaviorPeriodData | null;
    contato_visual_objetos?: BehaviorPeriodData | null;
    engajamento?: BehaviorPeriodData | null;
    fuga?: BehaviorPeriodData | null;
    crise?: BehaviorPeriodData | null;
    inapto?: BehaviorPeriodData | null;
    atividade_preferencial?: BehaviorPeriodData | null;
  } | null;
};

/** Table comparing observed-behavior counts between two periods. */
export function ComparisonBehaviors({ data }: ComparisonBehaviorsProps) {
  const { t } = useI18n();
  return (
    <View
      style={{
        backgroundColor: colors.level2,
        borderWidth: 1,
        borderColor: colors.outline
      }}
      className="w-full rounded-2xl p-6"
    >
      <Text className="text-content text-lg font-bold mb-4" style={{ fontFamily: "Inter" }}>
        {t("analysis.behaviors.comparisonTitle")}
      </Text>

      <View className="flex-row items-center px-1 mb-3">
        <View className="flex-[2]">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 11 }}>{t("analysis.behavior.behavior")}</Text>
        </View>
        <View className="flex-[1.2] items-center">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 10 }}>{t("analysis.period1")}</Text>
        </View>
        <View className="flex-[1.2] items-center">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 10 }}>{t("analysis.period2")}</Text>
        </View>
        <View className="flex-[2] items-end right-2">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 11 }}>{t("analysis.variation")}</Text>
        </View>
      </View>

      <View className="space-y-3">
        <ComparisonCard
          title={t("analysis.behaviorChart.stereotypy.legend")}
          period1={{ value: data?.estereotipia?.p1 ?? 0 }}
          period2={{ value: data?.estereotipia?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.eyePeople.legend")}
          period1={{ value: data?.contato_visual_pessoas?.p1 ?? 0 }}
          period2={{ value: data?.contato_visual_pessoas?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.eyeObjects.legend")}
          period1={{ value: data?.contato_visual_objetos?.p1 ?? 0 }}
          period2={{ value: data?.contato_visual_objetos?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.engagement.legend")}
          period1={{ value: data?.engajamento?.p1 ?? 0 }}
          period2={{ value: data?.engajamento?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.escape.legend")}
          period1={{ value: data?.fuga?.p1 ?? 0 }}
          period2={{ value: data?.fuga?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.crisis.legend")}
          period1={{ value: data?.crise?.p1 ?? 0 }}
          period2={{ value: data?.crise?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.unfit.legend")}
          period1={{ value: data?.inapto?.p1 ?? 0 }}
          period2={{ value: data?.inapto?.p2 ?? 0 }}
        />

        <ComparisonCard
          title={t("analysis.behaviorChart.preferred.legend")}
          period1={{ value: data?.atividade_preferencial?.p1 ?? 0 }}
          period2={{ value: data?.atividade_preferencial?.p2 ?? 0 }}
        />
      </View>

      <View className="flex-row items-start mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.outline }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.level1, borderWidth: 1, borderColor: colors.outline, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <AlertCircle color={colors.muted} size={18} />
        </View>
        <Text className="text-slate-400 text-[12px]" style={{ flex: 1, fontFamily: "Inter", color: colors.muted }}>
          {t("analysis.behaviors.footnote")}
        </Text>
      </View>

    </View>
  );
}

export default ComparisonBehaviors;