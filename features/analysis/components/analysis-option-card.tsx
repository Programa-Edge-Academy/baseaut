import { colors } from "@/assets/colors";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type AnalysisOptionCardProps = {
  title: string;
  description: string;
  status?: "registrado" | "nao_registrado" | string;
  onPress: () => void;
  className?: string;
};

export function AnalysisOptionCard({
  title,
  description,
  status,
  onPress,
  className,
}: AnalysisOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-full flex-row items-center rounded-lg border border-outline bg-level2 p-[15px] active:opacity-80 ${className ?? ""}`}
    >
      <View className="flex-1 pr-4 gap-1">
        <Text className="text-[16px] font-bold text-white" style={{ fontFamily: "Inter-Bold" }}>
          {title}
        </Text>
        <Text className="text-[12px] font-medium text-muted leading-[16px]" style={{ fontFamily: "Inter-Medium" }}>
          {description}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {status === "registrado" && (
          <Text className="text-[12px] font-medium text-[#34C759]" style={{ fontFamily: "Inter-Medium" }}>
            Registrado
          </Text>
        )}
        {status === "nao_registrado" && (
          <Text className="text-[12px] font-medium text-muted" style={{ fontFamily: "Inter-Medium" }}>
            Não registrado
          </Text>
        )}
        {status && status !== "registrado" && status !== "nao_registrado" && (
          <Text className="text-[12px] font-medium text-muted" style={{ fontFamily: "Inter-Medium" }}>
            {status}
          </Text>
        )}
        <ChevronRight size={20} color={colors.muted} />
      </View>
    </Pressable>
  );
}
