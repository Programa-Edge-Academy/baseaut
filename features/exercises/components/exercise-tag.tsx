import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import React from "react";
import { Pressable, Text } from "react-native";

export type TagProps = {
  label: string;
  height?: number;
  borderRadius?: number;
  isActive?: boolean;
  onPress?: () => void;
};

export function ExerciseTag({
  label,
  height = 30,
  borderRadius = 15,
  isActive = false,
  onPress,
}: TagProps) {
  return (
    <Pressable
      onPress={onPress}
      className="justify-center border items-center"
      style={{
        height,
        borderRadius,
        paddingHorizontal: 15,
        backgroundColor: isActive ? withOpacity(colors.primary, 0.1) : colors.level2,
        borderColor: isActive ? colors.primary : colors.outline,
      }}
    >
      <Text
        className="text-center text-default-2 leading-5"
        style={{
          color: isActive ? "#FFFFFF" : colors.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
