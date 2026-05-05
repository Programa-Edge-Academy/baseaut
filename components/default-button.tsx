import React from "react";
import { Pressable, Text, PressableProps } from "react-native";

type DefaultButtonProps = PressableProps & {
  label: string;
  bgColorClass?: string;       // Define background color. Ex: 'bg-primary' or 'bg-red-500'
  shadowClass?: string;        // Define shadow color. Ex: 'shadow-lg shadow-black/30'
  isOutline?: boolean;         // Switch to outline mode.
  sizeClass?: string;          // Define height and weidth. Ex: 'w-full h-11' or 'px-6 py-3'
  textClassName?: string;      // Extra class to text (color, size, font)
  outlineBorderClass?: string; // Color border if isOutline is true
};

export function DefaultButton({
  label,
  onPress,
  bgColorClass = "bg-primary",
  shadowClass = "shadow-lg shadow-primary/75",
  isOutline = false,
  sizeClass = "w-40 h-11", 
  textClassName,
  outlineBorderClass = "border-primary", // Editable!
  className,
  ...rest // Allow calling other functions like disabled, onLongPress, etc.
}: DefaultButtonProps) { 
  
// Logic to build the style based on props
  const baseClasses = "items-center justify-center rounded-2xl flex-row";
  const outlineClasses = isOutline ? `border-2 bg-transparent ${outlineBorderClass}` : bgColorClass;
  const appliedShadow = !isOutline && shadowClass ? shadowClass : "";

// Defines the base text color, but allows textClassName to override it
  const defaultTextColor = isOutline ? "text-primary" : "text-white";

  return (
    <Pressable
      onPress={onPress}
      className={`${baseClasses} ${sizeClass} ${outlineClasses} ${appliedShadow} ${className ?? ""}`}
      {...rest}
    >
      <Text
        className={`text-base font-bold leading-5 ${defaultTextColor} ${textClassName ?? ""}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}