import React from "react";
import { Pressable, Text, TextStyle, ViewStyle } from "react-native";

type LoginButtonProps = {
  label?: string;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function LoginButton({
  label = "Entrar",
  onPress,
  className,
  textClassName,
  style,
  textStyle,
}: LoginButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-11 w-80 items-center justify-center rounded-2xl bg-primary shadow-[0px_0px_10px_0px_rgba(14,137,229,0.25)] ${className ?? ""}`}
      style={style}
    >
      <Text
        className={`text-base font-bold leading-5 text-white ${textClassName ?? ""}`}
        style={textStyle}
      >
        {label}
      </Text>
    </Pressable>
  );
}
