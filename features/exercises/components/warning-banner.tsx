import React from "react";
import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { colors } from "@/assets/colors";

interface WarningBannerProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function WarningBanner({
  title = "Há atividades pendentes no histórico",
  subtitle = "Responda o formulário incompleto no histórico",
  className = "",
}: WarningBannerProps) {
  return (
    <View 
      className={`w-full max-w-md items-center justify-center rounded-[20px] bg-level1 p-5 border border-outline ${className}`}
    >
      {/* Ícone de Alerta Amarelo/Amber */}
      <View className="mb-2">
        <AlertCircle size={24} color={colors.extra} strokeWidth={2.5} />
      </View>

      {/* Conteúdo de Texto Centralizado */}
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