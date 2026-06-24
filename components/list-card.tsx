import { colors } from "@/assets/colors";
import { CardMenu } from "@/components/card-menu";
import { withOpacity } from "@/components/color-opacity";
import { RipplePressable } from "@/components/ripple-pressable";
import { AlertCircle, ChevronRight, MoreVertical } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Pressable, Text, View, ViewProps } from "react-native";

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
  rightActionColor?: string; // Novo opcional para pendencias
  badge?: ListCardBadge;
  pendencyAlert?: boolean;
  className?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showDuplicate?: boolean;
  editLabel?: string;
  enableRipple?: boolean;
};

export function ListCard({
  title,
  subtitle,
  icon,
  iconBgColor = withOpacity(colors.muted, 0.2),
  rightAction = "more",
  rightActionColor,
  badge,
  pendencyAlert = false,
  className,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  showDuplicate = false,
  editLabel,
  enableRipple = false,
}: ListCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [menuLayout, setMenuLayout] = useState({ top: 0, left: 0, width: 0 });
  const hasMenuOptions = !!(onEdit || onDelete || onDuplicate);

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
        if (!hasMenuOptions) return null;
        return (
          <Pressable
            ref={buttonRef}
            onPress={handleMorePress}
            className="h-10 w-10 items-center justify-center active:opacity-60"
          >
            <MoreVertical size={24} color={rightActionColor || colors.muted} />
          </Pressable>
        );
      case "chevron":
        return (
          <View className="h-10 w-10 items-center justify-center">
            {/* 🛠️ APLICAÇÃO AQUI */}
            <ChevronRight size={24} color={rightActionColor || colors.muted} />
          </View>
        );
      case "none":
      default:
        return null;
    }
  };

  const isInteractive = !!(onPress || onEdit || onDelete || onDuplicate);
  const PressableComponent: React.ComponentType<any> = isInteractive
    ? enableRipple ? RipplePressable : Pressable
    : View;

  // 🛠️ NOVO: Remove a borda padrão se o className injetado já tiver comandos de borda
  const defaultBorder = className?.includes("border") ? "" : "border border-outline";

  return (
    <PressableComponent
      onPress={onPress}
      // 🛠️ Substitua a linha do className por esta:
      className={`mb-4 h-20 w-full flex-row items-center rounded-2xl bg-level2 p-3.5 ${defaultBorder} ${
        onPress && !enableRipple ? "active:opacity-80" : ""
      } ${className ?? ""}`}
      style={{ zIndex: menuVisible ? 10 : 1 }}
    >
      <View className="relative mr-3.5 h-11 w-11">
        {/* O Quadrado de Fundo do Ícone */}
        <View
          className="h-full w-full items-center justify-center rounded-2xl"
          style={{
            backgroundColor: iconBgColor,
            ...(pendencyAlert
              ? { borderWidth: 2, borderColor: colors.extra }
              : null),
          }}
        >
          {icon}
        </View>
      </View>

      <View className="flex-1 flex-col justify-center pr-2">
        <View className="flex-row items-center">
          <Text
            className="text-base font-medium text-white flex-shrink"
            style={pendencyAlert ? { color: colors.extra } : undefined}
            numberOfLines={1}
          >
            {title}
          </Text>
          {badge && (
            <View
              className="ml-2 items-center justify-center rounded-[10px] px-2 py-0.5"
              style={{ backgroundColor: withOpacity(badge.color, 0.1) }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: badge.color }}
              >
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
            editLabel={editLabel}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}
      </View>
    </PressableComponent>
  );
}
