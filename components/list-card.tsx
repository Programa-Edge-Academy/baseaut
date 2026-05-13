import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { ChevronRight, MoreVertical } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type RightActionType = "more" | "chevron" | "none";

export type ListCardBadge = {
  label: string;
  color: string;
};

export type ListCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  rightAction?: RightActionType;
  badge?: ListCardBadge;
  onPress?: () => void;
  onOptionsPress?: () => void;
};

export function ListCard({
  title,
  subtitle,
  icon,
  iconBgColor = withOpacity(colors.muted, 0.2),
  rightAction = "more",
  badge,
  onPress,
  onOptionsPress,
}: ListCardProps) {
  const renderRightAction = () => {
    switch (rightAction) {
      case "more":
        return (
          <Pressable onPress={onOptionsPress} className="p-2 active:opacity-70">
            <MoreVertical size={20} color={colors.muted} />
          </Pressable>
        );
      case "chevron":
        return (
          <View className="p-2">
            <ChevronRight size={20} color={colors.muted} />
          </View>
        );
      case "none":
      default:
        return null;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="mb-2.5 min-h-[80px] w-full flex-row items-center rounded-2xl border border-outline bg-level2 p-3.5 active:opacity-80"
    >
      <View
        className="mr-3.5 h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </View>

      <View className="flex-1 flex-col justify-center">
        <View className="flex-row items-center pr-2">
          <Text className="text-default-1 text-white flex-shrink" numberOfLines={1}>
            {title}
          </Text>
          {badge && (
            <View
              className="ml-2 items-center justify-center rounded-[10px] px-2 py-0.5"
              style={{ backgroundColor: withOpacity(badge.color, 0.1) }}
            >
              <Text
                className="text-default-3"
                style={{ color: badge.color }}
              >
                {badge.label}
              </Text>
            </View>
          )}
        </View>

        <Text className="mt-0.5 text-default-2 text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      {renderRightAction()}
    </Pressable>
  );
}