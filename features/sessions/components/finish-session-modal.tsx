import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { AlertCircle, Check, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

/**
 * Default list of session finalization reasons. Values are the identifiers
 * persisted/mapped to the `motivo_nao_realizacao_enum`; the display label comes
 * from {@link MOTIVO_LABEL_KEYS}.
 */
export const DEFAULT_FINISH_MOTIVOS = [
  "Recusa do aluno",
  "Comportamento disruptivo",
  "Fadiga ou cansaço",
  "Tempo insuficiente",
  "Dificuldade física",
  "Outro",
];

/** Maps each reason value to its localized display key. */
const MOTIVO_LABEL_KEYS: Record<string, TranslationKey> = {
  "Recusa do aluno": "activityResult.motive.refusal",
  "Comportamento disruptivo": "activityResult.motive.disruptive",
  "Fadiga ou cansaço": "activityResult.motive.fatigue",
  "Tempo insuficiente": "activityResult.motive.insufficientTime",
  "Dificuldade física": "activityResult.motive.physicalDifficulty",
  Outro: "activityResult.motive.other",
};

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
  /**
   * Tutorial spotlight key for the reason options. "Outro" is deliberately left
   * outside the highlight, since it also demands a free-text description.
   */
  reasonSpotlightKey?: string;
};

/**
 * Modal shown when finalizing a session before completion. Forces the user to
 * select a "motivo" before confirming. Uses the project's error tokens for the
 * destructive confirm action.
 *
 * @remarks
 * It renders its own {@link TutorialSpotlight} so a sub-step targeting the
 * reason options is highlighted over the modal instead of behind it.
 */
export function FinishSessionModal({
  visible,
  onClose,
  onConfirm,
  motivos = DEFAULT_FINISH_MOTIVOS,
  title,
  message,
  cancelLabel,
  confirmLabel,
  pendingExercises = [],
  reasonSpotlightKey,
}: FinishSessionModalProps) {
  const { t } = useI18n();
  const sim = useTutorialSimulation();
  const reasonsRef = useRef<View>(null);

  useEffect(() => {
    if (!reasonSpotlightKey) return;
    sim.registerTarget(reasonSpotlightKey, reasonsRef, { rounded: true });
    return () => sim.unregisterTarget(reasonSpotlightKey);
  }, [sim, reasonSpotlightKey]);
  const resolvedTitle = title ?? t("session.finishTitle");
  const resolvedMessage = message ?? t("session.finishMessage");
  const resolvedCancelLabel = cancelLabel ?? t("common.cancel");
  const resolvedConfirmLabel = confirmLabel ?? t("common.finish");
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

  const renderMotivo = (motivo: string) => {
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
        <Text className="text-default-1 text-content">
          {MOTIVO_LABEL_KEYS[motivo] ? t(MOTIVO_LABEL_KEYS[motivo]) : motivo}
        </Text>
        {isActive && <Check size={18} color={colors.primary} />}
      </Pressable>
    );
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
              <Text className="text-header-2 text-content">{resolvedTitle}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Text className="text-default-2 text-muted leading-5">{resolvedMessage}</Text>

          {pendingExercises.length > 0 && (
            <Text className="text-default-2 text-muted leading-5">
              {t("session.pendingWillBeUnrealized")}{" "}
              <Text className="text-content">[{pendingExercises.join(", ")}]</Text>
            </Text>
          )}

          <Text className="text-default-1 text-content">{t("session.reasonLabel")}</Text>

          <ScrollView style={{ maxHeight: 260 }}>
            <View className="gap-2.5">
              <View ref={reasonsRef} collapsable={false} className="gap-2.5">
                {motivos.filter((motivo) => motivo !== "Outro").map(renderMotivo)}
              </View>
              {motivos.filter((motivo) => motivo === "Outro").map(renderMotivo)}
            </View>
          </ScrollView>

          {isOutro && (
            <View className="gap-1.5">
              <Text className="text-default-2 text-muted">
                {t("activityResult.motiveDescription")}
              </Text>
              <TextInput
                value={outroDescricao}
                onChangeText={(text) => {
                  setOutroDescricao(text);
                  setSubmitted(false);
                }}
                placeholder={t("session.reasonPlaceholder")}
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
                  {t("session.reasonDescRequired")}
                </Text>
              )}
            </View>
          )}

          <View className="flex-row gap-2.5">
            <DefaultButton
              label={resolvedCancelLabel}
              onPress={onClose}
              bgColorClass="bg-level2"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              sizeClass="flex-1 h-11"
            />
            <DefaultButton
              label={resolvedConfirmLabel}
              onPress={handleConfirm}
              bgColorClass="bg-error"
              shadowClass="shadow-errorShadow"
              sizeClass="flex-1 h-11"
              textClassName="text-content"
            />
          </View>

          <TutorialSpotlight />
        </Pressable>
      </Pressable>
    </AppModal>
  );
}
