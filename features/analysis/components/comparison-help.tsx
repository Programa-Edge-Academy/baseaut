import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import ComparisonCard from "./comparison-card";

/** Help counts for each compared period. */
export interface HelpPeriodData {
  p1: number;
  p2: number;
  diferenca_absoluta?: number;
  variacao_percentual?: number;
}

/** Props for {@link ComparisonHelp}. */
export type ComparisonHelpProps = {
  data?: {
    autonomo?: HelpPeriodData | null;
    ajuda_intrusiva?: HelpPeriodData | null;
  } | null;
};

/** Table comparing autonomous vs intrusive help counts between two periods. */
export default function ComparisonHelp({ data }: ComparisonHelpProps) {
  const { t } = useI18n();
  const autonomoP1 = data?.autonomo?.p1 ?? 0;
  const autonomoP2 = data?.autonomo?.p2 ?? 0;
  const intrusiveP1 = data?.ajuda_intrusiva?.p1 ?? 0;
  const intrusiveP2 = data?.ajuda_intrusiva?.p2 ?? 0;

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
        {t("analysis.help.comparisonTitle")}
      </Text>

      <View className="flex-row items-center px-1 mb-3">
        <View className="flex-[2]">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 11 }}>{t("analysis.help.type")}</Text>
        </View>
        <View className="flex-[1.2] items-center left-4">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 10 }}>{t("analysis.period1")}</Text>
        </View>
        <View className="flex-[1.2] items-center left-4">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 10 }}>{t("analysis.period2")}</Text>
        </View>
        <View className="flex-[2] items-end right-2">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 11 }}>{t("analysis.variation")}</Text>
        </View>
      </View>

      <View className="space-y-3">
        <ComparisonCard
          title={t("analysis.help.intrusive")}
          period1={{ value: intrusiveP1 }}
          period2={{ value: intrusiveP2 }}
        />

        <ComparisonCard
          title={t("analysis.help.autonomous")}
          period1={{ value: autonomoP1 }}
          period2={{ value: autonomoP2 }}
        />
      </View>

      <View className="flex-row items-start mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.outline }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.level1, borderWidth: 1, borderColor: colors.outline, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <AlertCircle color={colors.muted} size={18} />
        </View>
        <Text className="text-slate-400 text-[12px]" style={{ flex: 1, fontFamily: "Inter", color: colors.muted }}>
          {t("analysis.help.footnote")}
        </Text>
      </View>
    </View>
  );
}
