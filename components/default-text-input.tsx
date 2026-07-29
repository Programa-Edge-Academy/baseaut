import { useThemeColors } from "@/features/settings/contexts/theme-context";
import React from "react";
import { TextInput, TextInputProps } from "react-native";

/** Props for {@link DefaultTextInput}. */
export interface DefaultTextInputProps extends TextInputProps {
  className?: string;
  /** Border color class. Defaults to "border-outline". */
  outLineBorderClass?: string;
}

/**
 * Themed {@link TextInput} with the app's background, border, and placeholder
 * styling. Aligns multiline content to the top. Text and placeholder colors
 * follow the active theme.
 */
export function DefaultTextInput({
  className,
  multiline,
  outLineBorderClass = "border-outline",
  ...rest
}: DefaultTextInputProps) {
  const colors = useThemeColors();
  const outLineClasses = `border ${outLineBorderClass}`;

  return (
    <TextInput
      multiline={multiline}
      {...rest}
      placeholderTextColor={colors.placeholder}
      textAlignVertical={multiline ? "top" : "center"}
      className={`bg-level1 px-3.5 py-3 rounded-[10px] text-content text-default-2 text-left ${outLineClasses} ${className ?? ""}`}
    />
  );
}
