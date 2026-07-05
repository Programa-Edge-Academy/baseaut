import { AppModal } from "@/components/app-modal";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { AlertCircle, LogOut, Trash2, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/assets/colors";
import { ActionButtons } from "./action-buttons";

/** Props for {@link ConfirmationModal}. */
export interface ConfirmationModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Called when the modal is dismissed without confirming. */
  onClose: () => void;
  /** Called when the user confirms the action. */
  onConfirm: () => void;
  /** Overrides the default title for the current mode. */
  title?: string;
  /** Overrides the default message for the current mode. */
  message?: string;
  /** Overrides the default confirm button label. */
  confirmLabel?: string;
  /** Overrides the default cancel button label. */
  cancelLabel?: string;
  /** Overrides the default icon for the current mode. */
  iconType?: "trash" | "alert" | "logout";
  /** Preset that drives default copy, icon, and styling. Defaults to "delete". */
  mode?: "delete" | "finishSession" | "logout" | "finishEngagement";
  /**
   * Tutorial spotlight key for the confirm button. When set, the confirm button
   * is registered as a highlight target and a spotlight is drawn over this modal.
   */
  confirmSpotlightKey?: string;
}

/**
 * Reusable confirmation dialog with presets for delete, session finish,
 * engagement finish, and logout flows. Each preset supplies default copy and
 * iconography that individual props can override.
 */
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
  confirmSpotlightKey,
}: ConfirmationModalProps) {
  const { t } = useI18n();
  const sim = useTutorialSimulation();
  const confirmButtonRef = useRef<View>(null);

  useEffect(() => {
    if (!confirmSpotlightKey) return;
    sim.registerTarget(confirmSpotlightKey, confirmButtonRef, { rounded: true });
    return () => sim.unregisterTarget(confirmSpotlightKey);
  }, [confirmSpotlightKey, sim]);

  const isFinishMode = mode === "finishSession";
  const isLogoutMode = mode === "logout";
  const isFinishEngagementMode = mode === "finishEngagement";

  const config = {
    title: title ?? (isFinishMode || isFinishEngagementMode ? t("confirm.finishSession.title") : isLogoutMode ? t("confirm.logout.title") : t("confirm.delete.title")),
    message: message ?? (
      isFinishEngagementMode
      ? t("confirm.finishEngagement.message")
      : isFinishMode
      ? t("confirm.finishSession.message")
      : isLogoutMode
      ? t("confirm.logout.message")
      : t("confirm.delete.message")
    ),
    confirmLabel: confirmLabel ?? (isFinishMode || isFinishEngagementMode ? t("common.finish") : isLogoutMode ? t("common.exit") : t("common.delete")),
    cancelLabel: cancelLabel ?? t("common.cancel"),
    iconType: iconType ?? (isLogoutMode ? "logout" : isFinishMode || isFinishEngagementMode ? "alert" : "trash"),
  };

  return (
    <AppModal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[400px] p-6 gap-6">
          <View className="flex-row items-center space-x-4">
            <View 
              className={`mr-4 rounded-full items-center justify-center`}
            >
              {config.iconType === "trash" ? (
                <Trash2 size={30} color={colors.error} />
              ) : config.iconType === "logout" ? (
                <LogOut size={30} color={colors.error} />
              ) : isFinishEngagementMode ? (
                <AlertCircle size={30} color={colors.extra} />
              ) : (
                <AlertCircle size={30} color={colors.error} />
              )}
            </View>

            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-content text-header-2">
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

          <ActionButtons
            onCancel={onClose}
            onSave={onConfirm}
            cancelLabel={config.cancelLabel}
            saveLabel={config.confirmLabel}
            mode={isFinishEngagementMode ? "warning" : "danger"}
            saveButtonRef={confirmSpotlightKey ? confirmButtonRef : undefined}
          />
        </View>

        <TutorialSpotlight />
      </View>
    </AppModal>
  );
}