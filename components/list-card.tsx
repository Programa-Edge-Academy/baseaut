import { colors } from "@/assets/colors";
import { CardMenu } from "@/components/card-menu";
import { withOpacity } from "@/components/color-opacity";
import { RipplePressable } from "@/components/ripple-pressable";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { ChevronRight, MoreVertical } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

/** Trailing affordance rendered on the right side of a {@link ListCard}. */
export type RightActionType = "more" | "chevron" | "none";

/** Small colored badge shown next to a {@link ListCard} title. */
export type ListCardBadge = {
  label: string;
  color: string;
};

/** Props for {@link ListCard}. */
export type ListCardProps = {
  title: string;
  subtitle?: string;
  /** Leading icon node rendered inside the colored square. */
  icon: React.ReactNode;
  /** Background color for the icon square. */
  iconBgColor?: string;
  /** Trailing action affordance. Defaults to "more". */
  rightAction?: RightActionType;
  /** Color override for the trailing action icon. */
  rightActionColor?: string;
  badge?: ListCardBadge;
  /** Highlights the card to flag a pending item. */
  pendencyAlert?: boolean;
  className?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  /** Shows the duplicate option in the context menu. Defaults to false. */
  showDuplicate?: boolean;
  editLabel?: string;
  /** Uses {@link RipplePressable} instead of {@link Pressable}. Defaults to false. */
  enableRipple?: boolean;
  /** Tutorial spotlight keys registered on the "more" (⋮) button. */
  moreButtonSpotlightKeys?: string[];
  /** Tutorial spotlight key for the menu's edit item. */
  editSpotlightKey?: string;
  /** Tutorial spotlight key for the menu's duplicate item. */
  duplicateSpotlightKey?: string;
  /** Tutorial spotlight key for the menu's delete item. */
  deleteSpotlightKey?: string;
  /** Called when the context menu opens (used by the tutorial to advance). */
  onMenuOpen?: () => void;
};

/**
 * Generic list row with a leading icon, title/subtitle, optional badge and
 * pendency highlight, and a trailing action that opens an edit/duplicate/delete
 * context menu.
 */
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
  moreButtonSpotlightKeys,
  editSpotlightKey,
  duplicateSpotlightKey,
  deleteSpotlightKey,
  onMenuOpen,
}: ListCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [menuLayout, setMenuLayout] = useState({ top: 0, left: 0, width: 0 });
  const hasMenuOptions = !!(onEdit || onDelete || onDuplicate);
  const sim = useTutorialSimulation();

  useEffect(() => {
    if (!moreButtonSpotlightKeys?.length) return;
    sim.registerTarget(moreButtonSpotlightKeys, buttonRef, { rounded: true });
    return () => sim.unregisterTarget(moreButtonSpotlightKeys);
  }, [moreButtonSpotlightKeys, sim]);

  const handleMorePress = () => {
    if (hasMenuOptions) {
      buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setMenuLayout({ top: pageY - height / 2, left: pageX, width });
        setMenuVisible(true);
        onMenuOpen?.();
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

  const defaultBorder = className?.includes("border") ? "" : "border border-outline";

  return (
    <PressableComponent
      onPress={onPress}
      className={`mb-4 h-20 w-full flex-row items-center rounded-2xl bg-level2 p-3.5 ${defaultBorder} ${
        onPress && !enableRipple ? "active:opacity-80" : ""
      } ${className ?? ""}`}
      style={{ zIndex: menuVisible ? 10 : 1 }}
    >
      <View className="relative mr-3.5 h-11 w-11">
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
            className="text-base font-medium text-content flex-shrink"
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
            editSpotlightKey={editSpotlightKey}
            duplicateSpotlightKey={duplicateSpotlightKey}
            deleteSpotlightKey={deleteSpotlightKey}
          />
        )}
      </View>
    </PressableComponent>
  );
}
