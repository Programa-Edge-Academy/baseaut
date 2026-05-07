import React from "react";
import { View } from "react-native";
import { DefaultButton } from "./default-button";

export interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  className?: string;
}

export function ActionButtons({
  onCancel,
  onSave,
  cancelLabel = "Cancelar",
  saveLabel = "Salvar",
  className,
}: ActionButtonsProps) {
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
      />
      <DefaultButton
        label={saveLabel}
        onPress={onSave}
        bgColorClass="bg-primary"
        shadowClass="shadow-primaryShadow"
        sizeClass="flex-1 h-11"
        textClassName="text-white"
      />
    </View>
  );
}