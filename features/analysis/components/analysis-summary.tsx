import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { AnalysisSummaryCard, AnalysisSummaryCardProps } from "./analysis-summary-card";

const defaultCards: AnalysisSummaryCardProps[] = [
  {
    title: "Exercícios avaliados",
    period1: { label: "Período 1", value: 6 },
    period2: { label: "Período 2", value: 8 }
  },
  {
    title: "Registros de ajuda",
    period1: { label: "Período 1", value: 14 },
    period2: { label: "Período 2", value: 9 },
  },
  {
    title: "Comportamentos observados",
    period1: { label: "Período 1", value: 7 },
    period2: { label: "Período 7", value: 7 },
  },
  {
    title: "Sessões registradas",
    period1: { label: "Período 1", value: 3 },
    period2: { label: "Período 2", value: 4 },
  }
];

export type AnalysisSummaryProps = {
  title?: string;
  cards?: AnalysisSummaryCardProps[];
  showNote?: boolean;
};

export function AnalysisSummary({
  title = "Resumo da comparação",
  cards = defaultCards,
  showNote = true,
}: AnalysisSummaryProps) {
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
        {/* Title */}
        <Text className="text-white text-[20px] font-bold mb-1">
          {title}
        </Text>

        {/* Rows */}
        <View className="gap-3">
          {cards.map((card, index) => (
            <AnalysisSummaryCard key={index} {...card} />
          ))}
        </View>

        {/* Footer Note */}
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
              Os valores exibem a diferença absoluta e percentual entre os dois períodos selecionados.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default AnalysisSummary;