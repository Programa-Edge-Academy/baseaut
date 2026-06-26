import React from "react";
import { View } from "react-native";
import { DefaultButton } from "./default-button";

/** Props for {@link ActionButtons}. */
export interface ActionButtonsProps {
  /** Called when the cancel button is pressed. */
  onCancel: () => void;
  /** Called when the save button is pressed. */
  onSave: () => void;
  /** Label for the cancel button. Defaults to "Cancelar". */
  cancelLabel?: string;
  /** Label for the save button. Defaults to "Salvar". */
  saveLabel?: string;
  className?: string;
  /** Disables both buttons and mutes the save styling. */
  disabled?: boolean;
  /** Visual intent of the save button. Defaults to "default". */
  mode?: "default" | "danger" | "warning";
}

/**
 * Paired cancel/save action row with intent-based styling for the save button.
 */
export function ActionButtons({
  onCancel,
  onSave,
  cancelLabel = "Cancelar",
  saveLabel = "Salvar",
  className,
  disabled = false,
  mode = "default",
}: ActionButtonsProps) {
  const saveBg = disabled ? "bg-muted" : mode === "danger" ? "bg-error" : mode === "warning" ? "bg-extra" : "bg-primary";
  const saveShadow = disabled ? "shadow-none" : mode === "danger" ? "shadow-errorShadow" : "shadow-none";
  const saveText = mode === "warning" ? "text-level1" : "text-white";
  return (
    <View className={`w-full flex-row items-center justify-between gap-4 ${className ?? ""}`}>
      <DefaultButton
        label={cancelLabel}
        onPress={onCancel}
        bgColorClass="bg-level1"
        shadowClass=""
        sizeClass="flex-1 h-11"
        className="border border-outline"
        textClassName="text-muted"
        rippleColor="rgba(255, 255, 255, 0.1)"
        disabled={disabled}
      />
      <DefaultButton
        label={saveLabel}
        onPress={onSave}
        bgColorClass={saveBg}
        shadowClass={saveShadow}
        sizeClass="flex-1 h-11"
        textClassName={saveText}
        disabled={disabled}
      />
    </View>
  );
}