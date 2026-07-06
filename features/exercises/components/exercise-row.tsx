import { colors } from "@/assets/colors";
import { RipplePressable } from "@/components/ripple-pressable";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/**
 * Props for a compact exercise row.
 */
interface ExerciseRowProps {
  name: string;
  description?: string;
  className?: string;
  onPress?: () => void;
}

/**
 * Renders a compact row item for an exercise selection list.
 */
export function ExerciseRow({
  name,
  description,
  onPress,
  className = "",
}: ExerciseRowProps) {
  return (
    <RipplePressable
      onPress={onPress}
      className={`w-full flex-row items-center justify-between rounded-[20px] bg-level1 p-4 border border-outline active:opacity-70 ${className}`}
    >
      <View className="flex-1 pr-4 justify-center">
        <Text className="text-[18px] font-bold text-content" numberOfLines={1}>
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

      <View className="items-center justify-center">
        <ChevronRight size={30} color={colors.muted} />
      </View>
    </RipplePressable>
  );
}
