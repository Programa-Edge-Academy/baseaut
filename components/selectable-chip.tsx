import { colors } from "@/assets/colors";
import { Check } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { RipplePressable } from "./ripple-pressable";
import { DefaultButton } from "./default-button";

// --- 1. DICTIONARIES ---

// REQUIREMENT: If 'nivelAjuda' is passed, it displays two predetermined buttons (Verbal and Modelo).
const subOptionsDict = {
  nivelAjuda: [
    { id: "verbal", label: "Verbal" },
    { id: "modelo", label: "Modelo" },
  ],
};

export type ChipType = "default" | "nivelAjuda" | "motivos";

// --- 2. COMPONENT PROPS ---
export type SelectableChipProps = {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  type?: ChipType; 
  selectedSubOption?: string | null;
  onSelectSubOption?: (id: string) => void;
  className?: string;
};

// --- 3. MAIN MASTER COMPONENT ---
export function SelectableChip({
  label,
  isSelected,
  onToggle,
  type = "default",
  selectedSubOption,
  onSelectSubOption,
  className = "",
}: SelectableChipProps) {
  
  // --- Dynamic Styling based on 'type' ---
  
  // 1. Setup base colors
  let activeBgBorder = "bg-primary/20 border-primary";
  let iconColor = colors.primary;
  let rippleInactive = "rgba(14, 137, 229, 0.3)"; 
  
  // REQUIREMENT: If the "motivos" parameter is passed, the selectable chip gets a red background and red borders.
  if (type === "motivos") {
    activeBgBorder = "bg-error/20 border-error";
    iconColor = colors.error;
    rippleInactive = "rgba(190, 34, 35, 0.3)"; 
  }

  // 3. Apply the final visual state
  const modoAtual = isSelected ? activeBgBorder : "bg-level2 border-outline";
  const currentRippleColor = isSelected ? "rgba(255, 255, 255, 0.2)" : rippleInactive;
  
  const subOptions = type === "nivelAjuda" ? subOptionsDict.nivelAjuda : null;

  // REQUIREMENT: The "motivos" selectable must not display the check icon.
  // The 'shouldShowCheck' variable ensures the icon only renders if the type is NOT "motivos".
  const shouldShowCheck = isSelected && type !== "motivos";

  return (
    <RipplePressable
      onPress={onToggle}
      rippleColor={currentRippleColor}
      className={`min-h-[44px] flex-row items-center px-[14px] rounded-2xl border ${modoAtual} ${className}`}
    >
      {/* Left Area: Icon + Label */}
      <View className="flex-row items-center flex-1">
        {shouldShowCheck && (
          <View style={{ marginRight: 5 }}>
            <Check color={iconColor} size={20} />
          </View>
        )}
        <Text className="text-white text-default1">
          {label}
        </Text>
      </View>

      {/* Right Area: Sub-Options (Uses DefaultButton) */}
      {/* REQUIREMENT: The "motivos" type has no inner buttons. 
          This is handled because 'subOptions' will be null for "motivos", skipping this block. */}
      {isSelected && subOptions && (
        <View className="flex-row gap-[8px]">
          {subOptions.map((option) => {
            
            // Checks if the current button is the one selected in the UI
            const isActive = selectedSubOption === option.id;
            
            return (
              <DefaultButton
                key={option.id}
                label={option.label}
                sizeClass="h-[32px] px-[16px]" 
                hasShadow={false}
                
                // REQUIREMENT: When clicked (active), it has no outline. When inactive, it has an outline.
                isOutline={!isActive}
                
                // REQUIREMENT: When active, bg-primary. When inactive, it remains transparent in this code.
                bgColorClass={isActive ? "bg-primary" : "bg-transparent"}
                
                outlineBorderClass="border-primary"
                
                // REQUIREMENT: When active, text-white. When inactive, text-primary.
                textClassName={`text-sm font-medium ${isActive ? "text-white" : "text-primary"}`}
                
                onPress={() => {
                  if (onSelectSubOption) onSelectSubOption(option.id);
                }}
              />
            );
          })}
        </View>
      )}
    </RipplePressable>
  );
}