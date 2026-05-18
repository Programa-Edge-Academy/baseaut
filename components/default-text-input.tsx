import { colors } from "@/assets/colors";
import React from "react";
import { TextInput, TextInputProps } from "react-native";

export interface DefaultTextInputProps extends TextInputProps {
  className?: string;
  bgColorClass?: string;
  outLineBorderClass?: string;
}

export function DefaultTextInput({
  className,
  multiline,
  outLineBorderClass = "border-outline",
  ...rest
}: DefaultTextInputProps) {
  const outLineClasses = `border ${outLineBorderClass}`;

  return (
    <TextInput
      multiline={multiline}
      {...rest}
      placeholderTextColor={colors.placeholder}
      textAlignVertical={multiline ? "top" : "center"}
      className={`bg-level1 px-3.5 py-3 rounded-[10px] text-white text-default-2 text-left ${outLineClasses} ${className ?? ""}`}
    />
  );
}
