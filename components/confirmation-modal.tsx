import { Trash2, X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { withOpacity } from "@/components/color-opacity";
import { colors } from "../assets/colors";
import { DefaultButton } from "./default-button";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
}: ConfirmationModalProps) {
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
          className="bg-level2 border border-outline rounded-xl p-6 shadow-lg w-[400px] max-w-[90%] gap-5"
          onPress={(e) => e.stopPropagation()}
        >

          {/* Header */}
          <View className="flex-row justify-between items-center gap-4">

            <View className="p-2 bg-error/20 rounded-xl">
              <Trash2
                size={30}
                color={colors.error}
              />
            </View>

            <View className="flex-1 flex-row justify-between items-center">

              <Text className="text-white text-xl font-bold">
                {title}
              </Text>

              <Pressable onPress={onClose}>
                <X
                  size={24}
                  color={colors.muted}
                />
              </Pressable>

            </View>

          </View>

          {/* Message */}
          <Text className="text-muted text-base font-medium leading-5">
            {message ? message : "Esta ação não pode ser desfeita."}
          </Text>

          {/* Actions */}
          <View className="flex-row justify-center gap-2.5">

            <DefaultButton
              label={cancelLabel}
              bgColorClass="bg-level2"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              sizeClass="w-40 h-11"
              onPress={onClose}
            />

            <DefaultButton
              label={confirmLabel}
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