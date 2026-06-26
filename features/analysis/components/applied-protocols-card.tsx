import React from "react";
import { Text, View } from "react-native";
import { AnalysisOptionCard } from "./analysis-option-card";

/** Props for {@link AppliedProtocolsCard}. */
export type AppliedProtocolsCardProps = {
  carsStatus?: string;
  ataStatus?: string;
  onCarsPress: () => void;
  onAtaPress: () => void;
};

/** Card linking to the student's applied protocol forms (CARS and ATA). */
export function AppliedProtocolsCard({
  carsStatus = "registrado",
  ataStatus = "registrado",
  onCarsPress,
  onAtaPress,
}: AppliedProtocolsCardProps) {
  return (
    <View className="w-full bg-level2 border border-outline rounded-lg p-[15px]">
      <Text className="text-[16px] font-bold text-white mb-[15px]" style={{ fontFamily: "Inter-Bold" }}>
        Protocolos/Testes aplicados
      </Text>

      <AnalysisOptionCard
        title="CARS"
        description="Visualizar formulário registrado"
        status={carsStatus}
        onPress={onCarsPress}
        className="mb-3"
      />

      <AnalysisOptionCard
        title="ATA"
        description="Visualizar formulário registrado"
        status={ataStatus}
        onPress={onAtaPress}
      />
    </View>
  );
}
