import { colors } from "@/assets/colors";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/** Props for {@link AnalysisSummaryCard}. */
export type AnalysisSummaryCardProps = {
  title: string;
  period1: {
    label?: string;
    value: string | number;
  };
  period2: {
    label?: string;
    value: string | number;
  };
  variation?: {
    label?: string;
    value?: string;
    status?: "positive" | "negative" | "neutral";
    iconColor?: string;
    textColor?: string;
  };
  className?: string;
  hasError?: boolean;
  hasInsufficientData?: boolean;
};

const statusToStyles = {
  positive: {
    iconColor: colors.secondary,
    textColor: colors.secondary,
    Icon: ArrowUpCircle,
  },
  negative: {
    iconColor: colors.error,
    textColor: colors.error,
    Icon: ArrowDownCircle,
  },
  neutral: {
    iconColor: colors.muted,
    textColor: colors.muted,
    Icon: MinusCircle,
  },
};

/** Parses a value into a finite number (accepting commas), or null. */
function parseNumber(value: string | number): number | null {
  if (typeof value === "number") {
    return value;
  }

  const parsed = parseFloat(String(value).replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Formats the absolute and relative variation between two period values. */
function getVariationText(period1Value: number, period2Value: number): string {
  const diff = period2Value - period1Value;

  if (diff === 0) {
    return "0 (0%)";
  }

  let relPercentage: number;

  if (period1Value === 0 && period2Value === 0) {
    relPercentage = 0;
  } else if (period1Value === 0 && period2Value > 0) {
    relPercentage = 100;
  } else if (period1Value > 0 && period2Value === 0) {
    relPercentage = -100;
  } else {
    relPercentage = Math.round((diff / period1Value) * 100);
  }

  const absDiff = Math.abs(diff);
  const absRel = Math.abs(relPercentage);

  if (diff > 0) {
    return `+${absDiff} (+${absRel}%)`;
  } else {
    return `-${absDiff} (-${absRel}%)`;
  }
}

export function AnalysisSummaryCard({
  title,
  period1,
  period2,
  variation,
  className,
  hasError,
  hasInsufficientData,
}: AnalysisSummaryCardProps) {
  if (hasError) {
    return (
      <View className={`rounded-2xl border border-outline bg-level2 p-4 justify-center items-center ${className ?? ""}`}>
        <Text className="text-sm font-medium text-error text-center">
          Não foi possível carregar o resumo da comparação. Tente novamente.
        </Text>
      </View>
    );
  }

  const numericPeriod1 = parseNumber(period1.value);
  const numericPeriod2 = parseNumber(period2.value);

  if (hasInsufficientData || numericPeriod1 === null || numericPeriod2 === null) {
    return (
      <View className={`rounded-2xl border border-outline bg-level2 p-4 justify-center items-center ${className ?? ""}`}>
        <Text className="text-sm font-medium text-muted text-center">
          Não há dados suficientes para comparar os períodos selecionados.
        </Text>
      </View>
    );
  }

  const derivedStatus =
    numericPeriod2 > numericPeriod1
      ? "positive"
      : numericPeriod2 < numericPeriod1
        ? "negative"
        : "neutral";

  const status = variation?.status || derivedStatus;
  const statusStyle = statusToStyles[status];
  const Icon = statusStyle.Icon;
  const iconColor = variation?.iconColor || statusStyle.iconColor;
  const textColor = variation?.textColor || statusStyle.textColor;
  const variationLabel = variation?.label || "Variação";
  const variationValue = variation?.value || getVariationText(numericPeriod1, numericPeriod2);

  return (
    <View className={`rounded-2xl border border-outline bg-level2 p-4 ${className ?? ""}`}>
      <Text className="text-xs font-medium text-white mb-3">{title}</Text>

      <View className="flex-row justify-between gap-3 items-start">
        <View className="flex-1">
          <Text className="text-[10px] font-medium text-muted mb-2">{period1.label ?? "Período 1"}</Text>
          <Text className="text-base font-medium text-white">{period1.value}</Text>
        </View>

        <View className="w-px h-10 self-stretch bg-outline my-2" />

        <View className="flex-1">
          <Text className="text-[10px] font-medium text-muted mb-2">{period2.label ?? "Período 2"}</Text>
          <Text className="text-base font-medium text-white">{period2.value}</Text>
        </View>

        <View className="w-px h-10 self-stretch bg-outline my-2" />

        <View className="flex-1 justify-center items-center">
          <Text className="text-[10px] font-medium text-muted mb-2 text-center">{variationLabel}</Text>
          <View className="flex-row items-center gap-2 justify-center">
            <Icon size={18} color={iconColor} strokeWidth={2} />
            <Text className="text-xs font-medium" style={{ color: textColor }}>
              {variationValue}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default AnalysisSummaryCard;