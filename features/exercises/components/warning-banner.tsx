import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/**
 * Props for the warning banner.
 */
interface WarningBannerProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Renders a warning banner with title and subtitle.
 */
export function WarningBanner({
  title = "Há atividades pendentes no histórico",
  subtitle = "Responda o formulário incompleto no histórico",
  className = "",
}: WarningBannerProps) {
  return (
    <View
      className={`w-full max-w-md items-center justify-center rounded-[20px] bg-level1 p-5 border border-outline ${className}`}
    >
      <View className="mb-2">
        <AlertCircle size={24} color={colors.extra} strokeWidth={2.5} />
      </View>

      <View className="items-center" style={{ gap: 4 }}>
        <Text className="text-[15px] font-semibold text-amber-500 text-center leading-5">
          {title}
        </Text>
        <Text className="text-[15px] font-semibold text-amber-500 text-center leading-5">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
