import React from "react";
import { View, Text, Pressable } from "react-native";
import { Dumbbell, MoreVertical } from "lucide-react-native";

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
      className={`w-full flex-row items-start gap-4 rounded-[20px] bg-[#14181F] p-4 ${className ?? ""}`}
    >
      {/* Ícone de Exercício */}
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#1D222B]">
        <Dumbbell size={28} color="#25C125" />
      </View>

      {/* Conteúdo de Texto */}
      <View className="flex-1 justify-center">
        <Text 
          className="text-[18px] font-bold text-white" 
          numberOfLines={1}
        >
          {name}
        </Text>

        {description ? (
          <Text 
            className="mt-1 text-[15px] leading-5 text-gray-400"
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}

        {/* Metadados (Tempo e Tags) */}
        <View className="mt-2 flex-row items-center">
          <Text className="text-[14px] text-gray-500">
            • {duration} • {tags}
          </Text>
        </View>
      </View>

      {/* Botão de Opções */}
      <Pressable 
        onPress={onPressOptions}
        className="h-10 w-6 items-center justify-center active:opacity-60"
      >
        <MoreVertical size={25} color="#94A3B8" />
      </Pressable>
    </View>
  );
}