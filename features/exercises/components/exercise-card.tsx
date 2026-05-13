import { Dumbbell, MoreVertical } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/assets/colors";

interface ExerciseCardProps {
  name: string;
  description?: string;
  duration: string;
  tags: string;
  onPressOptions?: () => void;
  className?: string;
}

export function ExerciseCard({
  name,
  description,
  duration,
  tags,
  onPressOptions,
  className,
}: ExerciseCardProps) {
  return (
    <View
      className={`w-full flex-row items-center gap-4 rounded-[20px] bg-level1 p-4 ${className ?? ""} border border-outline`}
    >
      {/* Ícone de Exercício */}
      <View 
      style={{ backgroundColor: colors.secondary + "15" }}
      className="h-16 w-16 items-center justify-center rounded-[20px]">
        <Dumbbell size={28} color={colors.secondary} />
      </View>

      {/* Conteúdo de Texto */}
      <View className="flex-1 justify-center">
        <Text className="text-[18px] font-bold text-white" numberOfLines={1}>
          {name}
        </Text>

        {description ? (
          <Text
            className="mt-1 text-[14px] leading-5 text-muted"
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}

        {/* Metadados (Tempo e Tags) */}
        <View className="mt-2 flex-row items-center">
          <Text className="text-[12px] text-muted">
            • {duration} • {tags}
          </Text>
        </View>
      </View>

      {/* Botão de Opções */}
      <Pressable
        onPress={onPressOptions}
        className="h-10 w-6 items-center justify-center active:opacity-60"
      >
        <MoreVertical size={25} color={colors.muted} />
      </Pressable>
    </View>
  );
}
