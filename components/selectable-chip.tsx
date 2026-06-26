import { colors } from "@/assets/colors";
import { Check } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { DefaultButton } from "./default-button";
import { RipplePressable } from "./ripple-pressable";

/** Predefined sub-option buttons rendered for the "nivelAjuda" chip type. */
const subOptionsDict = {
  nivelAjuda: [
    { id: "verbal", label: "Verbal" },
    { id: "modelo", label: "Modelo" },
  ],
};

/** Visual/behavioral variant of a {@link SelectableChip}. */
export type ChipType = "default" | "nivelAjuda" | "motivos";

/** Props for {@link SelectableChip}. */
export type SelectableChipProps = {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  type?: ChipType;
  /**
   * IDs of the active sub-options. Supports multi-select: "verbal" and "modelo"
   * can be selected at the same time.
   */
  selectedSubOptions?: string[];
  onSelectSubOption?: (id: string) => void;
  /**
   * When true, shows a red border and background to flag a missing required
   * selection. Only visible while the chip is not selected.
   */
  hasError?: boolean;
  /**
   * When true, shows a red border and text on inactive sub-option buttons,
   * indicating that at least one must be chosen.
   */
  subOptionsHasError?: boolean;
  className?: string;
};

/**
 * Toggleable chip with optional inline sub-options. The "motivos" type uses an
 * error-colored style with no check icon, while "nivelAjuda" renders multi-select
 * sub-option buttons.
 */
export function SelectableChip({
  label,
  isSelected,
  onToggle,
  type = "default",
  selectedSubOptions = [],
  onSelectSubOption,
  hasError = false,
  subOptionsHasError = false,
  className = "",
}: SelectableChipProps) {
  let activeBgBorder = "bg-primary/20 border-primary";
  let iconColor = colors.primary;
  let rippleInactive = "rgba(255, 255, 255, 0.2)";

  if (type === "motivos") {
    activeBgBorder = "bg-error/20 border-error";
    iconColor = colors.error;
    rippleInactive = "rgba(190, 34, 35, 0.3)";
  }

  const modoAtual = isSelected
    ? activeBgBorder
    : hasError
    ? "bg-error/10 border-error"
    : "bg-level2 border-outline";

  const currentRippleColor = isSelected ? "rgba(14, 137, 229, 0.3)" : rippleInactive;

  const subOptions = type === "nivelAjuda" ? subOptionsDict.nivelAjuda : null;

  const shouldShowCheck = isSelected && type !== "motivos";

  return (
    <RipplePressable
      onPress={onToggle}
      rippleColor={currentRippleColor}
      className={`min-h-[44px] flex-row items-center px-[14px] rounded-2xl border ${modoAtual} ${className}`}
    >
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

      {isSelected && subOptions && (
        <View className="flex-row gap-[8px]">
          {subOptions.map((option) => {
            const isActive = selectedSubOptions.includes(option.id);

            const subBorderClass =
              subOptionsHasError && !isActive ? "border-error" : "border-primary";
            const subTextClass = isActive
              ? "text-white"
              : subOptionsHasError
              ? "text-error"
              : "text-primary";

            return (
              <DefaultButton
                key={option.id}
                label={option.label}
                sizeClass="h-[32px] px-[16px]"
                hasShadow={false}
                isOutline={true}
                bgColorClass={isActive ? "bg-primary" : "bg-transparent"}
                outlineBorderClass={subBorderClass}
                textClassName={`text-sm font-medium ${subTextClass}`}
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