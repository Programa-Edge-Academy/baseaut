import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { useRouter } from "expo-router";
import { HelpCircle, Info } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

/** Props for {@link TutorialPracticeNotice}. */
export type TutorialPracticeNoticeProps = {
  /** Whether the notice modal is visible. */
  visible: boolean;
  /** Dismisses the modal, keeping the practice open ("Got it"). */
  onClose: () => void;
  /**
   * Optional screen-specific cleanup run before leaving. Stopping the simulation
   * and navigating back to the tutorial list are handled here, so screens must
   * not do either themselves.
   */
  onExit?: () => void;
};

/**
 * Modal shown by the "Em tutorial" header button on every tutorial practice
 * replica. Its default view summarizes that the screen is practice-only and
 * offers three actions — leave the practice, ask for help, or dismiss. The
 * help view shows the current sub-step's hint (from
 * {@link useTutorialSimulation}) so the user always knows what to do next.
 */
export function TutorialPracticeNotice({
  visible,
  onClose,
  onExit,
}: TutorialPracticeNoticeProps) {
  const colors = useThemeColors();
  const { t } = useI18n();
  const { currentHintKey } = useTutorialSimulation();
  const sessionSim = useSessionSimController();
  const router = useRouter();
  const [view, setView] = useState<"notice" | "help">("notice");

  const handleExit = () => {
    onExit?.();
    sessionSim.stop();
    router.replace("/tutorial");
  };

  // Always reopen on the notice view.
  useEffect(() => {
    if (!visible) setView("notice");
  }, [visible]);

  const hintText = currentHintKey ? t(currentHintKey) : t("tutorial.helpDone");

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-6"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-[420px] rounded-2xl border border-outline bg-level2 p-5 gap-4"
          onPress={(e) => e.stopPropagation()}
        >
          {view === "notice" ? (
            <>
              <View className="flex-row items-center gap-3">
                <View className="rounded-xl bg-primary/15 p-2">
                  <Info size={24} color={colors.primary} />
                </View>
                <Text className="text-header-2 text-content flex-1">
                  {t("tutorial.inTutorial")}
                </Text>
              </View>

              <Text className="text-default-2 text-muted leading-6">
                {t("tutorial.practiceNotice")}
              </Text>

              <DefaultButton
                label={t("tutorial.askHelp")}
                onPress={() => setView("help")}
                sizeClass="w-full h-11"
              />
              <View className="flex-row gap-3">
                <DefaultButton
                  label={t("tutorial.exitPractice")}
                  onPress={handleExit}
                  sizeClass="flex-1 h-11"
                  bgColorClass="bg-level1"
                  hasShadow={false}
                  isOutline
                  outlineBorderClass="border-outline"
                  textClassName="text-muted"
                />
                <DefaultButton
                  label={t("common.gotIt")}
                  onPress={onClose}
                  sizeClass="flex-1 h-11"
                  bgColorClass="bg-level1"
                  hasShadow={false}
                  isOutline
                  outlineBorderClass="border-outline"
                  textClassName="text-content"
                />
              </View>
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-3">
                <View className="rounded-xl bg-secondary/15 p-2">
                  <HelpCircle size={24} color={colors.secondary} />
                </View>
                <Text className="text-header-2 text-content flex-1">
                  {t("tutorial.helpTitle")}
                </Text>
              </View>

              <Text className="text-default-2 text-muted leading-6">
                {hintText}
              </Text>

              <View className="flex-row gap-3">
                <DefaultButton
                  label={t("common.back")}
                  onPress={() => setView("notice")}
                  sizeClass="flex-1 h-11"
                  bgColorClass="bg-level1"
                  hasShadow={false}
                  isOutline
                  outlineBorderClass="border-outline"
                  textClassName="text-muted"
                />
                <DefaultButton
                  label={t("common.gotIt")}
                  onPress={onClose}
                  sizeClass="flex-1 h-11"
                />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </AppModal>
  );
}
