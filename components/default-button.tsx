import React from "react";
import { Text, PressableProps, View } from "react-native";
import { RipplePressable } from "./ripple-pressable";

/** Props for {@link DefaultButton}. */
type DefaultButtonProps = Omit<PressableProps, 'children'> & {
  /** Text rendered inside the button. */
  label: string;
  /** Optional node rendered before the label (e.g. a provider logo). */
  icon?: React.ReactNode;
  /** Background utility class. Defaults to "bg-primary". */
  bgColorClass?: string;
  /** Whether to apply the shadow class. Defaults to true. */
  hasShadow?: boolean;
  /** Shadow utility class. Defaults to "shadow-primaryShadow". */
  shadowClass?: string;
  /** Renders the button with a border and transparent-style fill. */
  isOutline?: boolean;
  /** Width/height utility classes. Defaults to "w-40 h-11". */
  sizeClass?: string;
  /** Overrides the default text color class. */
  textClassName?: string;
  /** Border color class used when {@link isOutline} is set. */
  outlineBorderClass?: string;
  /** Ripple color for the press feedback. */
  rippleColor?: string;
  /** Overrides the default text size class. */
  customTextSize?: string;
};

/**
 * Primary app button built on {@link RipplePressable}, with configurable
 * background, shadow, outline, size, and text styling, plus an optional leading
 * icon rendered before the label.
 */
export function DefaultButton({
  label,
  icon,
  bgColorClass = "bg-primary",
  hasShadow = true,
  shadowClass = "shadow-primaryShadow",
  isOutline = false,
  sizeClass = "w-40 h-11",
  textClassName,
  outlineBorderClass = "border-primary",
  rippleColor,
  customTextSize,
  className,
  ...rest
}: DefaultButtonProps) {
  const baseClasses = "items-center justify-center rounded-2xl flex-row";
  const outlineClasses = isOutline ? `border-2 ${outlineBorderClass} ${bgColorClass}` : bgColorClass;
  const appliedShadow = hasShadow && shadowClass ? shadowClass : "";
  const defaultTextColor = isOutline ? "text-primary" : "text-white";
  const finalRippleColor = rippleColor ? rippleColor : "rgba(255, 255, 255, 0.2)";

  return (
    <RipplePressable
      rippleColor={finalRippleColor}
      className={`${baseClasses} ${sizeClass} ${outlineClasses} ${appliedShadow} ${className ?? ""}`}
      {...rest}
    >
      {icon ? <View className="mr-2">{icon}</View> : null}
      <Text
        className={`${customTextSize || "text-header-3"} ${textClassName ? textClassName : defaultTextColor}`}
      >
        {label}
      </Text>
    </RipplePressable>
  );
}