import { AlertCircle, Trash2, X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  iconType?: "trash" | "alert";
  mode?: "delete" | "finishSession";
}

export function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  iconType,
  mode = "delete",
}: ConfirmationModalProps) {
  
  const isFinishMode = mode === "finishSession";

  const config = {
    title: title ?? (isFinishMode ? "Finalizar sessão?" : "Excluir"),
    message: message ?? (isFinishMode 
      ? "O progresso atual desta sessão será salvo de acordo com o tipo de circuito escolhido." 
      : "Esta ação não pode ser desfeita."),
    cancelLabel: cancelLabel ?? (isFinishMode ? "Voltar" : "Cancelar"),
    confirmLabel: confirmLabel ?? (isFinishMode ? "Cancelar" : "Excluir"),
    iconType: iconType ?? (isFinishMode ? "alert" : "trash"),
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className="bg-level2 border border-outline rounded-xl p-6 shadow-panelShadow w-[400px] max-w-[90%] gap-5"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center gap-4">
            <View className="p-2 bg-error/20 rounded-xl">
              {config.iconType === "trash" ? (
                <Trash2 size={30} color={colors.error} />
              ) : (
                <AlertCircle size={30} color={colors.error} />
              )}
            </View>

            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-white text-header-2">
                {config.title}
              </Text>
              <Pressable onPress={onClose} className="p-1 active:opacity-70">
                <X size={24} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Text className="text-muted text-default-1 leading-5">
            {config.message}
          </Text>

          <View className="flex-row justify-center gap-2.5">
            <DefaultButton
              label={config.cancelLabel}
              bgColorClass="bg-level2"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              sizeClass="w-40 h-11"
              onPress={onClose}
            />

            <DefaultButton
              label={config.confirmLabel}
              textClassName="text-white"
              bgColorClass="bg-error"
              shadowClass="shadow-errorShadow"
              sizeClass="w-40 h-11"
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}