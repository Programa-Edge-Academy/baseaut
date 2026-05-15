import { colors } from "@/assets/colors";
import { ListFilter, Search } from "lucide-react-native";
import React from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

export interface SearchInputProps extends TextInputProps {
  containerClassName?: string;
  inputClassName?: string;
  iconSize?: number;
  iconColor?: string;
  showTags?: boolean;
  onTagsPress?: () => void;
}

export function SearchInput({
  containerClassName,
  inputClassName,
  iconSize = 18,
  iconColor = colors.muted,
  placeholder = "Buscar por nome...",
  showTags = false,
  onTagsPress,
  ...rest
}: SearchInputProps) {
  
  const searchBox = (
    <View
      className={`h-[44px] flex-row items-center rounded-[15px] border border-outline bg-level2 px-3 ${
        showTags ? "flex-1" : (containerClassName ?? "")
      }`}
    >
      <Search color={iconColor} size={iconSize} />
      <TextInput
        {...rest}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={false}
        scrollEnabled={false}
        textAlignVertical="center"
        className={`ml-2 h-full flex-1 p-0 m-0 text-default-1 text-white ${
          inputClassName ?? ""
        }`}
        style={[
          {
            paddingVertical: 0,
            includeFontPadding: false,
          },
          rest.style,
        ]}
      />
    </View>
  );

  if (!showTags) {
    return searchBox;
  }

  return (
    <View className={`flex-row items-center gap-3 ${containerClassName ?? ""}`}>
      {searchBox}
      
      <Pressable
        onPress={onTagsPress}
        className="h-[44px] flex-row items-center justify-center gap-2 rounded-[15px] border border-outline bg-level2 px-4 active:opacity-70"
      >
        <ListFilter size={18} color={colors.muted} />
        <Text className="text-default-1 text-muted">Tags</Text>
      </Pressable>
    </View>
  );
}