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
        backgroundColor: isActive ? "#1A2836" : "#1B1F27",
        borderColor: isActive ? "#0E89E5" : "#2B303B",
      }}
    >
      <Text
        className="text-center text-default-2 leading-5"
        style={{
          color: isActive ? "#FFFFFF" : "#66758A",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
