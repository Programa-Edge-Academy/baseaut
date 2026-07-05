import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { AlertCircle, Check, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

/** Default list of session finalization reasons. */
export const DEFAULT_FINISH_MOTIVOS = [
  "Recusa do aluno",
  "Comportamento disruptivo",
  "Fadiga ou cansaço",
  "Tempo insuficiente",
  "Dificuldade física",
  "Outro",
];

/** Props for {@link FinishSessionModal}. */
export type FinishSessionModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, descricao?: string) => void;
  motivos?: string[];
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Names of pending exercises that will be recorded as not performed. */
  pendingExercises?: string[];
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
  pendingExercises = [],
}: FinishSessionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [outroDescricao, setOutroDescricao] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      setOutroDescricao("");
      setSubmitted(false);
    }
  }, [visible]);

  const isOutro = selected === "Outro";
  const outroError = submitted && isOutro && outroDescricao.trim() === "";

  const handleConfirm = () => {
    setSubmitted(true);
    if (!selected) return;
    if (isOutro && outroDescricao.trim() === "") return;
    onConfirm(selected, isOutro ? outroDescricao.trim() : undefined);
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
              <Text className="text-header-2 text-content">{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Text className="text-default-2 text-muted leading-5">{message}</Text>

          {pendingExercises.length > 0 && (
            <Text className="text-default-2 text-muted leading-5">
              Estes exercícios serão registrados como não realizados:{" "}
              <Text className="text-content">[{pendingExercises.join(", ")}]</Text>
            </Text>
          )}

          <Text className="text-default-1 text-content">Motivo:</Text>

          <ScrollView style={{ maxHeight: 260 }}>
            <View className="gap-2.5">
              {motivos.map((motivo) => {
                const isActive = selected === motivo;
                return (
                  <Pressable
                    key={motivo}
                    onPress={() => {
                      setSelected(motivo);
                      setSubmitted(false);
                    }}
                    className="flex-row items-center justify-between rounded-2xl border bg-level1 p-3 active:opacity-70"
                    style={{
                      borderColor: isActive ? colors.primary : colors.outline,
                    }}
                  >
                    <Text className="text-default-1 text-content">{motivo}</Text>
                    {isActive && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {isOutro && (
            <View className="gap-1.5">
              <Text className="text-default-2 text-muted">
                Descrição do motivo:
              </Text>
              <TextInput
                value={outroDescricao}
                onChangeText={(text) => {
                  setOutroDescricao(text);
                  setSubmitted(false);
                }}
                placeholder="Descreva o motivo..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.level1,
                  borderColor: outroError ? colors.error : colors.outline,
                  borderWidth: 1,
                  borderRadius: 15,
                  padding: 10,
                  color: "#fff",
                  fontFamily: "Inter-Medium",
                  fontSize: 14,
                  textAlignVertical: "top",
                  minHeight: 80,
                }}
              />
              {outroError && (
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.error }}>
                  Descreva o motivo da finalização.
                </Text>
              )}
            </View>
          )}

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
              textClassName="text-content"
            />
          </View>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}
