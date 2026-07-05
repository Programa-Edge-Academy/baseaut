import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
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
  /** When set, spotlights the "continue" button under this key (tutorial). */
  continueSpotlightKey?: string;
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
  title,
  message,
  continueLabel,
  finishLabel,
  continueSpotlightKey,
}: ConcurrentSessionModalProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("concurrentSession.title");
  const resolvedMessage = message ?? t("concurrentSession.message");
  const resolvedContinueLabel = continueLabel ?? t("concurrentSession.continueLabel");
  const resolvedFinishLabel = finishLabel ?? t("concurrentSession.finishLabel");
  const continueButton = (
    <DefaultButton
      label={resolvedContinueLabel}
      sizeClass="w-full h-11"
      textClassName="text-content font-bold"
      onPress={onContinueCurrent}
    />
  );
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
            <Text className="flex-1 text-content text-xl font-bold leading-5">
              {resolvedTitle}
            </Text>
            <Pressable onPress={onRequestClose} className="active:opacity-70">
              <X size={28} color={colors.muted} />
            </Pressable>
          </View>

          <Text className="text-muted text-base font-medium leading-5">
            {resolvedMessage}
          </Text>

          {continueSpotlightKey ? (
            <SpotlightTarget targetKey={continueSpotlightKey}>
              {continueButton}
            </SpotlightTarget>
          ) : (
            continueButton
          )}

          <DefaultButton
            label={resolvedFinishLabel}
            sizeClass="w-full h-11"
            bgColorClass="bg-error"
            shadowClass="shadow-errorShadow"
            textClassName="text-content font-bold"
            onPress={onFinishAndStartNew}
          />
        </View>

        {continueSpotlightKey && <TutorialSpotlight />}
      </View>
    </AppModal>
  );
}
