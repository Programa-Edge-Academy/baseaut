import { colors } from "@/assets/colors";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export type ComparisonCardProps = {
  title: string;
  period1: {
    label?: string; // Mantido por retrocompatibilidade, mas omitido no design horizontal
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
  const sign = diff > 0 ? "+" : ""; // O sinal de menos (-) já é incluído naturalmente por números negativos
  const percentage =
    period1Value !== 0
      ? Math.round(((period2Value - period1Value) / period1Value) * 100)
      : 0;
  
  // Exemplo de saída: -3 (-37%)
  return `${diff} (${sign}${percentage}%)`;
}

export function ComparisonCard({
  title,
  period1,
  period2,
  variation,
  className,
}: ComparisonCardProps) {
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
  
  const variationValue =
    numericPeriod1 !== null && numericPeriod2 !== null
      ? getVariationText(numericPeriod1, numericPeriod2)
      : variation?.value || "-";

  return (
    <View className={`rounded-xl border border-outline bg-level2 px-4 py-3 justify-center ${className ?? ""}`}>
      <View className="flex-row items-center justify-between">
        
        {/* Column 1: Title */}
        <View className="flex-[2] justify-center">
          <Text className="text-sm font-normal text-white" numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Column 2: Value Period 1 */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-normal text-white">
            {period1.value}
          </Text>
        </View>

        {/* Divisor */}
        <View className="w-px h-6 bg-white mx-4" />

        {/* Column 3: Value Period 2 */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-normal text-white">
            {period2.value}
          </Text>
        </View>

        {/* Divisor */}
        <View className="w-px h-6 bg-white mx-4" />

        {/* Column 4: Icon and Variation Percentage */}
        <View className="flex-[2] flex-row items-center justify-end gap-1.5">
          <Icon size={16} color={iconColor} strokeWidth={2.5} />
          <Text className="text-xs font-medium" style={{ color: textColor }}>
            {variationValue}
          </Text>
        </View>

      </View>
    </View>
  );
}

export default ComparisonCard;