import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { ListFilter, Search } from "lucide-react-native";
import React from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

/** Props for {@link SearchInput}. */
export interface SearchInputProps extends TextInputProps {
  containerClassName?: string;
  inputClassName?: string;
  /** Search icon size. Defaults to 18. */
  iconSize?: number;
  /** Search icon color. Defaults to the muted token. */
  iconColor?: string;
  /** Renders an adjacent tags filter button. Defaults to false. */
  showTags?: boolean;
  /** Called when the tags filter button is pressed. */
  onTagsPress?: () => void;
}

/**
 * Single-line search field with a leading icon and an optional tags filter
 * button rendered beside it.
 */
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
  const { t } = useI18n();
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
        className={`ml-2 h-full flex-1 p-0 m-0 text-default-1 text-content ${
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
    <View className={`w-full flex-row items-center gap-3 ${containerClassName ?? ""}`}>
      {searchBox}
      
      <Pressable
        onPress={onTagsPress}
        className="h-[44px] flex-row items-center justify-center gap-2 rounded-[15px] border border-outline bg-level2 px-4 active:opacity-70"
      >
        <ListFilter size={18} color={colors.muted} />
        <Text className="text-default-1 text-muted">{t("common.tags")}</Text>
      </Pressable>
    </View>
  );
}
