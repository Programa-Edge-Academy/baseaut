import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "@/assets/colors";


interface ExerciseRowProps {
  name: string;
  description?: string;
  className?: string;
  onPress?: () => void;
}

export function ExerciseRow({
    name,
    description,
    onPress,
    className = "",
}: ExerciseRowProps) {
    return (
    <Pressable
      onPress={onPress}
      className={`w-full flex-row items-center justify-between rounded-[20px] bg-level1 p-4 border border-outline active:opacity-70 ${className}`}
    >
    {/* Conteúdo de Texto */}
    <View className="flex-1 pr-4 justify-center">
        <Text 
        className="text-[18px] font-bold text-white" 
        numberOfLines={1}
        >
        {name}
        </Text>
        {description ? (
          <Text
            className="mt-1 text-[14px] leading-5 text-muted font-bold"
            numberOfLines={2}
          >
            {description}
        </Text>
        ) : null}
      </View>

      {/* Ícone de Navegação / Ação (Seta para a direita) */}
      <View className="items-center justify-center">
        <ChevronRight size={30} color={colors.muted} />
      </View>
      </Pressable>
    );
}
