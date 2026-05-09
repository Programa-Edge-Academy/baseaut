import React from "react";
import { Text, PressableProps } from "react-native";
import { RipplePressable } from "./ripple-pressable";

type DefaultButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  bgColorClass?: string;       
  shadowClass?: string;        
  isOutline?: boolean;         
  sizeClass?: string;          
  textClassName?: string;      
  outlineBorderClass?: string; 
  rippleColor?: string;
};

export function DefaultButton({
  label,
  bgColorClass = "bg-primary",
  shadowClass = "shadow-primaryShadow",
  isOutline = false,
  sizeClass = "w-40 h-11", 
  textClassName,
  outlineBorderClass = "border-primary",
  rippleColor,
  className,
  ...rest 
}: DefaultButtonProps) { 
  
  const baseClasses = "items-center justify-center rounded-2xl flex-row";
  const outlineClasses = isOutline ? `border-2 bg-transparent ${outlineBorderClass}` : bgColorClass;
  const appliedShadow = !isOutline && shadowClass ? shadowClass : "";

  const defaultTextColor = isOutline ? "text-primary" : "text-white";
  
  const finalRippleColor = rippleColor || (isOutline ? "rgba(14, 137, 229, 0.2)" : "rgba(255, 255, 255, 0.3)");

  return (
    <RipplePressable
      rippleColor={finalRippleColor}
      className={`${baseClasses} ${sizeClass} ${outlineClasses} ${appliedShadow} ${className ?? ""}`}
      {...rest}
    >
      <Text
        className={`text-header-3 ${defaultTextColor} ${textClassName ?? ""}`}
      >
        {label}
      </Text>
    </RipplePressable>
  );
}