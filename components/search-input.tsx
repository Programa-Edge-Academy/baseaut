import { colors } from "@/assets/colors";
import { Search } from "lucide-react-native";
import React from "react";
import { TextInput, TextInputProps, View } from "react-native";

export interface SearchInputProps extends TextInputProps {
  containerClassName?: string;
  inputClassName?: string;
  iconSize?: number;
  iconColor?: string;
}

export function SearchInput({
  containerClassName,
  inputClassName,
  iconSize = 18,
  iconColor = colors.muted,
  placeholder = "Buscar por nome...",
  ...rest
}: SearchInputProps) {
  return (
    <View
      className={`h-[44px] flex-row items-center rounded-[15px] border border-outline bg-level2 px-3 ${
        containerClassName ?? ""
      }`}
    >
      <Search color={iconColor} size={iconSize} />
      <TextInput
        {...rest}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        className={`ml-2 flex-1 text-default-2 text-white ${
          inputClassName ?? ""
        }`}
      />
    </View>
  );
}
