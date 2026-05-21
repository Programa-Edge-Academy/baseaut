import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface ConcurrentSessionModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onOpenConcurrent: () => void;
  onCancelAndStartNew: () => void;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  backLabel?: string;
}

export function ConcurrentSessionModal({
  visible,
  onRequestClose,
  onOpenConcurrent,
  onCancelAndStartNew,
  title = "Sessão em andamento",
  message = "Já existe uma sessão ativa. O que deseja fazer?",
  confirmLabel = "Abrir sessão concorrente",
  cancelLabel = "Cancelar existente e iniciar nova",
  backLabel = "Voltar",
}: ConcurrentSessionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-[320px] rounded-2xl bg-level2 p-6 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-outline">
          <View className="flex-row items-center justify-between gap-3 mb-4">
            <Text className="text-white text-xl font-bold leading-5">
              {title}
            </Text>
            <Pressable
              onPress={onRequestClose}
              className="p-2 rounded-xl active:opacity-70"
            >
              <X size={24} color={colors.muted} />
            </Pressable>
          </View>

          <Text className="text-muted text-base font-medium leading-5 mb-6">
            {message}
          </Text>

          <View className="space-y-3 mb-4">
            <DefaultButton
              label={confirmLabel}
              sizeClass="w-full h-11"
              bgColorClass="bg-level2"
              isOutline
              outlineBorderClass="border-primary"
              textClassName="text-white"
              hasShadow={false}
              onPress={onOpenConcurrent}
            />

            <DefaultButton
              label={cancelLabel}
              sizeClass="w-full h-11"
              bgColorClass="bg-error/20"
              isOutline
              outlineBorderClass="border-error"
              textClassName="text-error"
              hasShadow={false}
              onPress={onCancelAndStartNew}
            />
          </View>

          <Pressable
            onPress={onRequestClose}
            className="items-center justify-center rounded-2xl h-11"
          >
            <Text className="text-muted text-base font-medium leading-5">
              {backLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
