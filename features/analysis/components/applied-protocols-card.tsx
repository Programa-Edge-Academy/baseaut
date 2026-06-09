import { colors } from "@/assets/colors";
import { Info } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { AnalysisOptionCard } from "./analysis-option-card";

export type AppliedProtocolsCardProps = {
  carsStatus?: string;
  ataStatus?: string;
  mabcStatus?: string;
  onCarsPress: () => void;
  onAtaPress: () => void;
  onMabcPress: () => void;
};

export function AppliedProtocolsCard({
  carsStatus = "registrado",
  ataStatus = "registrado",
  mabcStatus = "registrado",
  onCarsPress,
  onAtaPress,
  onMabcPress,
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
        className="mb-3"
      />

      {/* MABC-2 Card */}
      <AnalysisOptionCard
        title="MABC-2"
        description="Visualizar dados registrados"
        status={mabcStatus}
        onPress={onMabcPress}
      />

      {/* Nota de rodapé */}
      <View className="flex-row items-start gap-2 mt-3 px-1">
        <Info size={14} color={colors.muted} className="mt-0.5" />
        <Text className="text-[10px] text-muted flex-1 leading-[14px]" style={{ fontFamily: "Inter-Medium" }}>
          Os dados do MABC-2 são apenas registrados e armazenados, sem cálculo automático pelo sistema.
        </Text>
      </View>
    </View>
  );
}
