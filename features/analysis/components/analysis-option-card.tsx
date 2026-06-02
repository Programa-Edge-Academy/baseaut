import { colors } from "@/assets/colors";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type AnalysisOptionCardProps = {
  title: string;
  description: string;
  onPress: () => void;
};

export function AnalysisOptionCard({
  title,
  description,
  onPress,
}: AnalysisOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full flex-row items-center rounded-lg border border-outline bg-level2 p-4 active:opacity-80"
    >
      <View className="flex-1 gap-1">
        <Text className="text-base font-bold text-white">{title}</Text>
        <Text className="text-xs font-medium text-muted">{description}</Text>
      </View>

      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}
