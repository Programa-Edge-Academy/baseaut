import React from "react";
import { Text, PressableProps } from "react-native";
import { RipplePressable } from "./ripple-pressable";

type DefaultButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  bgColorClass?: string;       
  hasShadow?: boolean;
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
  hasShadow = true,
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
      <Text
        className={`text-header-3 ${textClassName ? textClassName : defaultTextColor}`}
      >
        {label}
      </Text>
    </RipplePressable>
  );
}