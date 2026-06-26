import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { X } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

/** Props for {@link ConcurrentSessionModal}. */
interface ConcurrentSessionModalProps {
  visible: boolean;
  onRequestClose: () => void;
  /** Called to resume the session already in progress. */
  onContinueCurrent: () => void;
  /** Called to finish the current session and start a new one. */
  onFinishAndStartNew: () => void;
  title?: string;
  message?: string;
  continueLabel?: string;
  finishLabel?: string;
}

/**
 * Modal shown when a session is already in progress for a student, letting the
 * user resume it or finish it before starting a new one.
 */
export function ConcurrentSessionModal({
  visible,
  onRequestClose,
  onContinueCurrent,
  onFinishAndStartNew,
  title = "Sessão em andamento",
  message = "Já existe uma sessão em andamento com este aluno. O que deseja fazer?",
  continueLabel = "Continuar sessão em andamento",
  finishLabel = "Finalizar sessão e iniciar nova",
}: ConcurrentSessionModalProps) {
  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-[360px] gap-4 rounded-2xl border border-outline bg-level2 p-6 shadow-panelShadow">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-white text-xl font-bold leading-5">
              {title}
            </Text>
            <Pressable onPress={onRequestClose} className="active:opacity-70">
              <X size={28} color={colors.muted} />
            </Pressable>
          </View>

          <Text className="text-muted text-base font-medium leading-5">
            {message}
          </Text>

          <DefaultButton
            label={continueLabel}
            sizeClass="w-full h-11"
            textClassName="text-white font-bold"
            onPress={onContinueCurrent}
          />

          <DefaultButton
            label={finishLabel}
            sizeClass="w-full h-11"
            bgColorClass="bg-error"
            shadowClass="shadow-errorShadow"
            textClassName="text-white font-bold"
            onPress={onFinishAndStartNew}
          />
        </View>
      </View>
    </AppModal>
  );
}
