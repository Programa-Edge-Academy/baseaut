import React from "react";
import { Text, View } from "react-native";
import { AnalysisOptionCard } from "./analysis-option-card";

export type AppliedProtocolsCardProps = {
  carsStatus?: string;
  ataStatus?: string;
  onCarsPress: () => void;
  onAtaPress: () => void;
};

export function AppliedProtocolsCard({
  carsStatus = "registrado",
  ataStatus = "registrado",
  onCarsPress,
  onAtaPress,
}: AppliedProtocolsCardProps) {
  return (
    <View className="w-full bg-level2 border border-outline rounded-lg p-[15px] mb-4">
      {/* Título */}
      <Text className="text-[16px] font-bold text-white mb-[15px]" style={{ fontFamily: "Inter-Bold" }}>
        Protocolos/Testes aplicados
      </Text>

      {/* CARS Card */}
      <AnalysisOptionCard
        title="CARS"
        description="Visualizar formulário registrado"
        status={carsStatus}
        onPress={onCarsPress}
        className="mb-3"
      />

      {/* ATA Card */}
      <AnalysisOptionCard
        title="ATA"
        description="Visualizar formulário registrado"
        status={ataStatus}
        onPress={onAtaPress}
      />
    </View>
  );
}
