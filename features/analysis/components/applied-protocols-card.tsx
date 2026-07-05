import { useI18n } from "@/features/settings/contexts/i18n-context";
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
  const { t } = useI18n();
  return (
    <View className="w-full bg-level2 border border-outline rounded-lg p-[15px]">
      <Text className="text-[16px] font-bold text-content mb-[15px]" style={{ fontFamily: "Inter-Bold" }}>
        {t("analysis.appliedProtocols")}
      </Text>

      <AnalysisOptionCard
        title="ATA"
        description={t("analysis.protocol.viewRegistered")}
        status={ataStatus}
        onPress={onAtaPress}
      />

      <AnalysisOptionCard
        title="CARS"
        description={t("analysis.protocol.viewRegistered")}
        status={carsStatus}
        onPress={onCarsPress}
        className="mb-3"
      />
    </View>
  );
}
