import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
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
    period2: { label: "Período 2", value: 7 },
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
  className?: string;
};

export function AnalysisSummary({
  title = "Resumo da comparação",
  cards = defaultCards,
  showNote = true,
  className,
}: AnalysisSummaryProps) {
  return (
    <ScrollView
      className={`flex-1 ${className ?? ""}`}
      contentContainerStyle={{ paddingHorizontal: 22, paddingVertical: 16, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="container bg-level2 border border-outline rounded-2xl p-4">
        <View className="container__conteudo flex-col gap-2">
          <Text className="container__titulo text-lg font-bold text-white">{title}</Text>

          {cards.map((card, index) => (
            <AnalysisSummaryCard key={index} {...card} />
          ))}

          {showNote && (
            <View className="flex-row gap-3 rounded-xl bg-level2 border border-outline p-3 mt-2">
              <AlertCircle size={20} color={colors.muted} strokeWidth={2} />
              <Text className="flex-1 text-xs font-medium text-muted leading-5">
                Os valores exibem a diferença absoluta e percentual entre os dois períodos selecionados.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export default AnalysisSummary;