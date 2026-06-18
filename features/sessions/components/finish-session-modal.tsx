import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { AlertCircle, Check, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export const DEFAULT_FINISH_MOTIVOS = [
  "Recusa do aluno",
  "Comportamento disruptivo",
  "Fadiga ou cansaço",
  "Tempo insuficiente",
  "Dificuldade física",
  "Outro",
];

export type FinishSessionModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  motivos?: string[];
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
};

/**
 * Modal shown when finalizing a session before completion. Forces the user to
 * select a "motivo" before confirming. Uses the project's error tokens for the
 * destructive confirm action.
 */
export function FinishSessionModal({
  visible,
  onClose,
  onConfirm,
  motivos = DEFAULT_FINISH_MOTIVOS,
  title = "Finalizar sessão?",
  message = "O progresso atual desta sessão será salvo de acordo com o tipo de circuito escolhido.",
  cancelLabel = "Cancelar",
  confirmLabel = "Finalizar",
}: FinishSessionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setSelected(null);
  }, [visible]);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  return (
    <AppModal
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
          className="bg-level2 border border-outline rounded-2xl gap-4 p-5"
          style={{ width: "92%", maxWidth: 400 }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center gap-3">
            <View className="p-2 bg-error/20 rounded-xl">
              <AlertCircle size={28} color={colors.error} />
            </View>
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-header-2 text-white">{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Text className="text-default-2 text-muted leading-5">{message}</Text>

          <Text className="text-default-1 text-white">Motivo:</Text>

          <ScrollView style={{ maxHeight: 260 }}>
            <View className="gap-2.5">
              {motivos.map((motivo) => {
                const isActive = selected === motivo;
                return (
                  <Pressable
                    key={motivo}
                    onPress={() => setSelected(motivo)}
                    className="flex-row items-center justify-between rounded-2xl border bg-level1 p-3 active:opacity-70"
                    style={{
                      borderColor: isActive ? colors.primary : colors.outline,
                    }}
                  >
                    <Text className="text-default-1 text-white">{motivo}</Text>
                    {isActive && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View className="flex-row gap-2.5">
            <DefaultButton
              label={cancelLabel}
              onPress={onClose}
              bgColorClass="bg-level2"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              sizeClass="flex-1 h-11"
            />
            <DefaultButton
              label={confirmLabel}
              onPress={handleConfirm}
              bgColorClass="bg-error"
              shadowClass="shadow-errorShadow"
              sizeClass="flex-1 h-11"
              textClassName="text-white"
            />
          </View>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}
