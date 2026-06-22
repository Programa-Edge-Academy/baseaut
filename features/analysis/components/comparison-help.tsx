import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import ComparisonCard from "./comparison-card";

export interface HelpPeriodData {
  p1: number;
  p2: number;
  diferenca_absoluta?: number;
  variacao_percentual?: number;
}

export type ComparisonHelpProps = {
  data?: {
    autonomo?: HelpPeriodData | null;
    ajuda_intrusiva?: HelpPeriodData | null;
  } | null;
};

export default function ComparisonHelp({ data }: ComparisonHelpProps) {
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
      <Text className="text-white text-lg font-bold mb-4" style={{ fontFamily: "Inter" }}>
        Comparação dos registros de ajuda
      </Text>

      <View className="flex-row items-center px-1 mb-3">
        <View className="flex-[2]">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 11 }}>Tipo</Text>
        </View>
        <View className="flex-[1.2] items-center left-4">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 10 }}>Período 1</Text>
        </View>
        <View className="flex-[1.2] items-center left-4">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 10 }}>Período 2</Text>
        </View>
        <View className="flex-[2] items-end right-2">
          <Text className="text-slate-400" style={{ fontFamily: "Inter", fontSize: 11 }}>Variação</Text>
        </View>
      </View>

      <View className="space-y-3">
        <ComparisonCard
          title="Ajuda Intrusiva"
          period1={{ value: intrusiveP1 }}
          period2={{ value: intrusiveP2 }}
        />

        <ComparisonCard
          title="Autônomo"
          period1={{ value: autonomoP1 }}
          period2={{ value: autonomoP2 }}
        />
      </View>

      <View className="flex-row items-start mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.outline }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.level1, borderWidth: 1, borderColor: colors.outline, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <AlertCircle color={colors.muted} size={18} />
        </View>
        <Text className="text-slate-400 text-[12px]" style={{ flex: 1, fontFamily: "Inter", color: colors.muted }}>
          Os valores exibem a diferença absoluta e percentual dos registros de ajuda entre os dois períodos selecionados.
        </Text>
      </View>
    </View>
  );
}
