import { colors } from "@/assets/colors";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

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

function parseNumber(value: string | number): number | null {
  if (typeof value === "number") {
    return value;
  }

  const parsed = parseFloat(String(value).replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getVariationText(period1Value: number, period2Value: number) {
  const diff = period2Value - period1Value;
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const absDiff = Math.abs(diff);
  const percentage =
    period1Value !== 0
      ? Math.round(((period2Value - period1Value) / period1Value) * 100)
      : 0;
  const percentageText = ` (${sign}${Math.abs(percentage)}%)`;

  return `${sign}${absDiff}${percentageText}`;
}

export function AnalysisSummaryCard({
  title,
  period1,
  period2,
  variation,
  className,
}: AnalysisSummaryCardProps) {
  const numericPeriod1 = parseNumber(period1.value);
  const numericPeriod2 = parseNumber(period2.value);

  const derivedStatus =
    numericPeriod1 !== null && numericPeriod2 !== null
      ? numericPeriod2 > numericPeriod1
        ? "positive"
        : numericPeriod2 < numericPeriod1
        ? "negative"
        : "neutral"
      : "neutral";

  const status = variation?.status || derivedStatus;
  const statusStyle = statusToStyles[status];
  const Icon = statusStyle.Icon;
  const iconColor = variation?.iconColor || statusStyle.iconColor;
  const textColor = variation?.textColor || statusStyle.textColor;
  const variationLabel = variation?.label || "Variação";
  const variationValue =
    numericPeriod1 !== null && numericPeriod2 !== null
      ? getVariationText(numericPeriod1, numericPeriod2)
      : variation?.value || "-";

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
