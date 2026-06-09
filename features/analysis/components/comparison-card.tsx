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

function parseNumber(value: string | number): number | null {
  if (typeof value === "number") {
    return value;
  }

  const parsed = parseFloat(
    String(value).replace(/,/g, ".")
  );

  return Number.isFinite(parsed) ? parsed : null;
}

function getVariationText(period1Value: number, period2Value: number): string {
  const diff = period2Value - period1Value;

  if (diff === 0) {
    return "0 (0%)";
  }

  let relPercentage: number;

  // Intercepta divisões por zero e formata de acordo com a direção do fluxo
  if (period1Value === 0 && period2Value === 0) {
    relPercentage = 0;
  } else if (period1Value === 0 && period2Value > 0) {
    relPercentage = 100;
  } else if (period1Value === 0 && period2Value < 0) {
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

export function ComparisonCard({
  title,
  period1,
  period2,
  variation,
  className,
  hasError,
  hasInsufficientData,
}: ComparisonCardProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  // 1. Trata estado de Erro crítico solicitado pelo QA
  if (hasError) {
    return (
      <View
        className={`rounded-xl border border-outline bg-level2 justify-center items-center ${isMobile ? "px-3 py-4" : "px-4 py-5"
          } ${className ?? ""}`}
      >
        <Text className="text-xs font-medium text-error text-center">
          Não foi possível carregar esta comparação. Tente novamente.
        </Text>
      </View>
    );
  }

  const numericPeriod1 = parseNumber(period1.value);
  const numericPeriod2 = parseNumber(period2.value);

  // 2. Trata estado de Dados Insuficientes solicitado pelo QA (via prop ou falha de parse)
  if (hasInsufficientData || numericPeriod1 === null || numericPeriod2 === null) {
    return (
      <View
        className={`rounded-xl border border-outline bg-level2 justify-center items-center ${isMobile ? "px-3 py-4" : "px-4 py-5"
          } ${className ?? ""}`}
      >
        <Text className="text-xs font-medium text-muted text-center">
          Dados insuficientes para comparação.
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

  const variationValue = variation?.value || getVariationText(numericPeriod1, numericPeriod2);

  return (
    <View
      className={`rounded-xl border border-outline bg-level2 ${isMobile ? "px-3 py-2" : "px-4 py-3"
        } ${className ?? ""}`}
    >
      <View className="flex-row items-center">
        {/* Title */}
        <View style={{ flex: 2.2, minWidth: 0 }}>
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
        <View style={{ flex: 0.8, alignItems: "center" }}>
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
        <View style={{ flex: 0.8, alignItems: "center" }}>
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