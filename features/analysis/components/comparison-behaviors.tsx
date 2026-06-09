import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import ComparisonCard from "./comparison-card";

export function ComparisonBehaviors() {
  return (
    <View className="w-full max-w-3xl rounded-2xl p-6" style={{ backgroundColor: colors.level2, borderWidth: 1, borderColor: colors.outline }}>

      {/* Title */}
      <Text className="text-white text-lg font-bold mb-4" style={{ fontFamily: "Inter" }}>
        Comparação dos comportamentos observados
      </Text>

      {/* Header labels aligned with ComparisonCard columns */}
      <View className="flex-row items-center px-1 mb-3">
        <View className="flex-[2]">
          <Text className="text-slate-400 text-xs" style={{ fontFamily: "Inter" }}>Comportamento</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-slate-400 text-xs" style={{ fontFamily: "Inter" }}>Período 1</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-slate-400 text-xs" style={{ fontFamily: "Inter" }}>Período 2</Text>
        </View>
        <View className="flex-[2] items-end">
          <Text className="text-slate-400 text-xs" style={{ fontFamily: "Inter" }}>Variação</Text>
        </View>
      </View>

      {/* Rows */}
      <View className="space-y-3">
        <ComparisonCard
          title="Estereotipias"
          period1={{ value: 6 }}
          period2={{ value: 3 }}
        />

        <ComparisonCard
          title="Contato visual"
          period1={{ value: 4 }}
          period2={{ value: 7 }}
        />

        <ComparisonCard
          title="Engajamento"
          period1={{ value: 5 }}
          period2={{ value: 8 }}
        />

        <ComparisonCard
          title="Fuga"
          period1={{ value: 3 }}
          period2={{ value: 1 }}
        />

        <ComparisonCard
          title="Crises"
          period1={{ value: 7 }}
          period2={{ value: 0 }}
        />
      </View>

      {/* Footer note */}
      <View className="flex-row items-start mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.outline }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.level1, borderWidth: 1, borderColor: colors.outline, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <AlertCircle color={colors.muted} size={18} />
        </View>
        <Text className="text-slate-400 text-[12px]" style={{ flex: 1, fontFamily: "Inter", color: colors.muted }}>
          Os valores exibem a diferença absoluta e percentual dos comportamentos observados entre os dois periodos selecionados.
        </Text>
      </View>

    </View>
  );
}

export default ComparisonBehaviors;