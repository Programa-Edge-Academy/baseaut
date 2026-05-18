import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { CardMenu } from "@/components/card-menu";
import { ChevronRight, MoreVertical } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

export type RightActionType = "more" | "chevron" | "none";

export type ListCardBadge = {
  label: string;
  color: string;
};

export type ListCardProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  rightAction?: RightActionType;
  badge?: ListCardBadge;
  className?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showDuplicate?: boolean;
};

export function ListCard({
  title,
  subtitle,
  icon,
  iconBgColor = withOpacity(colors.muted, 0.2),
  rightAction = "more",
  badge,
  className,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  showDuplicate = false,
}: ListCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [menuLayout, setMenuLayout] = useState({ top: 0, left: 0, width: 0 });
  const hasMenuOptions = !!(onEdit && onDelete);

  const handleMorePress = () => {
    if (hasMenuOptions) {
      buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setMenuLayout({ top: pageY + height, left: pageX, width });
        setMenuVisible(true);
      });
    }
  };

  const renderRightAction = () => {
    switch (rightAction) {
      case "more":
        return (
          <Pressable
            ref={buttonRef}
            onPress={handleMorePress}
            className="h-10 w-10 items-center justify-center active:opacity-60"
          >
            <MoreVertical size={24} color={colors.muted} />
          </Pressable>
        );
      case "chevron":
        return (
          <View className="h-10 w-10 items-center justify-center">
            <ChevronRight size={24} color={colors.muted} />
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
      className={`mb-4 h-20 w-full flex-row items-center rounded-2xl border border-outline bg-level2 p-3.5 ${onPress ? "active:opacity-80" : ""} ${className ?? ""}`}
      style={{ zIndex: menuVisible ? 10 : 1 }}
    >
      <View
        className="mr-3.5 h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </View>

      <View className="flex-1 flex-col justify-center pr-2">
        <View className="flex-row items-center">
          <Text className="text-base font-medium text-white flex-shrink" numberOfLines={1}>
            {title}
          </Text>
          {badge && (
            <View
              className="ml-2 items-center justify-center rounded-[10px] px-2 py-0.5"
              style={{ backgroundColor: withOpacity(badge.color, 0.1) }}
            >
              <Text className="text-xs font-bold" style={{ color: badge.color }}>
                {badge.label}
              </Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text className="text-sm font-medium text-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="relative z-50">
        {renderRightAction()}
        
        {hasMenuOptions && (
          <CardMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            layout={menuLayout}
            showDuplicate={showDuplicate}
            onEdit={onEdit!}
            onDuplicate={onDuplicate}
            onDelete={onDelete!}
          />
        )}
      </View>
    </Pressable>
  );
}