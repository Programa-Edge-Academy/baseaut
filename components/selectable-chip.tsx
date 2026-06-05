import { colors } from "@/assets/colors";
import { Check } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { DefaultButton } from "./default-button";
import { RipplePressable } from "./ripple-pressable";

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
  /**
   * IDs das sub-opções ativas. Suporta multi-select: "verbal" e "modelo"
   * podem estar selecionados ao mesmo tempo.
   * Substitui a antiga prop `selectedSubOption: string | null`.
   */
  selectedSubOptions?: string[];
  onSelectSubOption?: (id: string) => void;
  /**
   * Quando true, exibe borda e fundo vermelhos no chip para indicar que
   * uma seleção obrigatória não foi feita. Só visível quando !isSelected.
   */
  hasError?: boolean;
  /**
   * Quando true, exibe borda e texto vermelhos nos botões de sub-opção
   * que não estão ativos, indicando que pelo menos um deve ser escolhido.
   */
  subOptionsHasError?: boolean;
  className?: string;
};

// --- 3. MAIN MASTER COMPONENT ---
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

  // 3. Apply the final visual state.
  //    Prioridade: isSelected → estilo ativo | hasError → estilo de erro | padrão → outline.
  const modoAtual = isSelected
    ? activeBgBorder
    : hasError
    ? "bg-error/10 border-error"
    : "bg-level2 border-outline";

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

            // CHANGED: multi-select — verifica se o id está no array, não compara string única.
            const isActive = selectedSubOptions.includes(option.id);

            // Sub-opções inativas ficam vermelhas quando subOptionsHasError=true.
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

                // REQUIREMENT: When clicked (active), it has no outline. When inactive, it has an outline.
                isOutline={!isActive}

                // REQUIREMENT: When active, bg-primary. When inactive, it remains transparent.
                bgColorClass={isActive ? "bg-primary" : "bg-transparent"}

                outlineBorderClass={subBorderClass}

                // REQUIREMENT: When active, text-white. When inactive, text-primary (or text-error on error).
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