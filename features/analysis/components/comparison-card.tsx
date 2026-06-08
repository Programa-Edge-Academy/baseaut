import { colors } from "@/assets/colors";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MinusCircle,
} from "lucide-react-native";
import React from "react";
import {
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export type ComparisonCardProps = {
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

  const parsed = parseFloat(
    String(value).replace(/,/g, ".")
  );

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getVariationText(
  period1Value: number,
  period2Value: number
) {
  const diff = period2Value - period1Value;

  const sign = diff > 0 ? "+" : "";

  const percentage =
    period1Value !== 0
      ? Math.round(
        ((period2Value - period1Value) /
          period1Value) *
        100
      )
      : 0;

  return `${diff} (${sign}${percentage}%)`;
}

export function ComparisonCard({
  title,
  period1,
  period2,
  variation,
  className,
}: ComparisonCardProps) {
  const { width } = useWindowDimensions();

  const isMobile = width < 480;

  const numericPeriod1 = parseNumber(period1.value);
  const numericPeriod2 = parseNumber(period2.value);

  const derivedStatus =
    numericPeriod1 !== null &&
      numericPeriod2 !== null
      ? numericPeriod2 > numericPeriod1
        ? "positive"
        : numericPeriod2 < numericPeriod1
          ? "negative"
          : "neutral"
      : "neutral";

  const status =
    variation?.status || derivedStatus;

  const statusStyle =
    statusToStyles[status];

  const Icon = statusStyle.Icon;

  const iconColor =
    variation?.iconColor ||
    statusStyle.iconColor;

  const textColor =
    variation?.textColor ||
    statusStyle.textColor;

  const variationValue =
    numericPeriod1 !== null &&
      numericPeriod2 !== null
      ? getVariationText(
        numericPeriod1,
        numericPeriod2
      )
      : variation?.value || "-";

  return (
    <View
      className={`rounded-xl border border-outline bg-level2 ${isMobile ? "px-3 py-2" : "px-4 py-3"
        } ${className ?? ""}`}
    >
      <View className="flex-row items-center">

        {/* Title */}
        <View
          style={{
            flex: 2.2,
            minWidth: 0,
          }}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              color: "white",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {title}
          </Text>
        </View>

        {/* Period 1 */}
        <View
          style={{
            flex: 0.8,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {period1.value}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: 20,
            backgroundColor: colors.outline,
            marginHorizontal: isMobile ? 6 : 10,
          }}
        />

        {/* Period 2 */}
        <View
          style={{
            flex: 0.8,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {period2.value}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: 20,
            backgroundColor: colors.outline,
            marginHorizontal: isMobile ? 6 : 10,
          }}
        />

        {/* Variation */}
        <View
          style={{
            flex: 1.5,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Icon
            size={isMobile ? 14 : 16}
            color={iconColor}
            strokeWidth={2}
          />

          <Text
            numberOfLines={1}
            style={{
              marginLeft: 4,
              color: textColor,
              fontSize: isMobile ? 10 : 12,
              flexShrink: 1,
            }}
          >
            {variationValue}
          </Text>
        </View>

      </View>
    </View>
  );
}

export default ComparisonCard;