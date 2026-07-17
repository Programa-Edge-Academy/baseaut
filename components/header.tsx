import { baseautLogoXml } from "@/assets/baseaut-logo";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useTutorial } from "@/features/tutorial/contexts/tutorial-context";
import { useUserRole } from "@/lib/use-user-role";
import { usePathname, useRouter } from "expo-router";
import { ArrowLeft, GraduationCap, HelpCircle, Save, Settings, User, Users, X } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from "react-native-svg";

/** Props for {@link Header}. */
type HeaderProps = {
  /** Selects which actions and layout the header renders. Defaults to "default". */
  variant?: "default" | "back" | "finish" | "finishEngagement" | "form" | "tutorial";
  /** Called when the back button is pressed. */
  onPressBack?: () => void;
  /** Called when a finish button is pressed (also the "Em tutorial" button). */
  onPressFinish?: () => void;
  /** Called when the form save button is pressed. */
  onPressSave?: () => void;
  /**
   * When provided, shows the icon-only "Em tutorial" button beside the logo
   * regardless of variant (used by the session-flow simulation, whose screens
   * keep their real back/finish variants). Opens the practice notice.
   */
  onPressTutorial?: () => void;
  /** Tutorial spotlight key for the back button. */
  backSpotlightKey?: string;
  /** Tutorial spotlight key for the finish button ("finish"/"finishEngagement"). */
  finishSpotlightKey?: string;
  /** Tutorial spotlight key for the form save button. */
  saveSpotlightKey?: string;
};

function withSpotlight(node: React.ReactNode, targetKey?: string) {
  return targetKey ? (
    <SpotlightTarget targetKey={targetKey}>{node}</SpotlightTarget>
  ) : (
    node
  );
}

/**
 * App top bar with the logo and variant-driven actions: default (team, account,
 * tutorial and settings shortcuts), back, session/engagement finish, and form
 * save. The "Em tutorial" practice button sits beside the logo (icon-only) so it
 * never competes with the centered actions. Logging out lives on the account page.
 */
export function Header({
  variant = "default",
  onPressBack,
  onPressFinish,
  onPressSave,
  onPressTutorial,
  backSpotlightKey,
  finishSpotlightKey,
  saveSpotlightKey,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useUserRole();
  const colors = useThemeColors();
  const { t } = useI18n();
  const { hidden: tutorialHidden } = useTutorial();

  const showBack = ["back", "finish", "finishEngagement", "form", "tutorial"].includes(variant);
  const showDefaultActions = variant === "default";
  const showFinishError = variant === "finish";
  const showFinishExtra = variant === "finishEngagement";
  const showFormSave = variant === "form";
  const showTutorialBanner = variant === "tutorial";

  const handleLogoPress = () => {
    if (pathname !== "/students") {
      router.replace("/students");
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="bg-level2">
      <View className="w-full items-center justify-center bg-level2 p-4">
        <View className="w-full flex-row items-center justify-between">

          <View className="flex-1 flex-row justify-start items-center">
            <Pressable onPress={handleLogoPress} className="active:opacity-80">
              <SvgXml xml={baseautLogoXml} width={76} height={34} />
            </Pressable>

            {(showTutorialBanner || onPressTutorial) && (
              <Pressable
                onPress={showTutorialBanner ? onPressFinish : onPressTutorial}
                accessibilityLabel={t("tutorial.inTutorial")}
                className="ml-3 h-10 w-10 flex-row items-center justify-center rounded-xl border-2 border-primary bg-primary/10 active:opacity-70"
              >
                <GraduationCap color={colors.primary} size={22} />
              </Pressable>
            )}
          </View>

          <View className="flex-1 flex-row justify-center items-center">
            {showFinishError &&
              withSpotlight(
                <Pressable
                  onPress={onPressFinish}
                  className="flex-row items-center px-4 py-2 rounded-xl border-2 border-error bg-error/10 active:opacity-70"
                >
                  <X color={colors.error} size={24} />
                  <Text className="text-error text-default-1 ml-2">{t("common.finish")}</Text>
                </Pressable>,
                finishSpotlightKey,
              )}

            {showFinishExtra &&
              withSpotlight(
                <Pressable
                  onPress={onPressFinish}
                  className="flex-row items-center px-4 py-2 rounded-xl border-2 border-extra bg-extra/10 active:opacity-70"
                >
                  <X color={colors.extra} size={24} />
                  <Text className="text-extra text-default-1 ml-2">{t("common.finish")}</Text>
                </Pressable>,
                finishSpotlightKey,
              )}

            {showFormSave &&
              withSpotlight(
                <Pressable
                  onPress={onPressSave}
                  className="flex-row items-center px-4 py-2.5 rounded-2xl bg-primary shadow-primaryShadow active:opacity-70"
                >
                  <Save color="#FFFFFF" size={20} />
                  <Text className="text-content text-default-1 ml-2">{t("common.save")}</Text>
                </Pressable>,
                saveSpotlightKey,
              )}
          </View>

          <View className="flex-1 flex-row justify-end items-center">
            {showDefaultActions && (
              <View className="flex-row items-center px-3 py-1.5">
                {role === "coordenador" && (
                  <Pressable onPress={() => router.push("/team")} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                    <Users color={colors.muted} size={24} />
                  </Pressable>
                )}

                {!tutorialHidden && (
                  <Pressable onPress={() => router.push("/tutorial" as never)} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                    <HelpCircle color={colors.muted} size={24} />
                  </Pressable>
                )}

                <Pressable onPress={() => router.push("/account")} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                  <User color={colors.muted} size={24} />
                </Pressable>

                <Pressable onPress={() => router.push("/settings")} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                  <Settings color={colors.muted} size={24} />
                </Pressable>
              </View>
            )}

            {showBack &&
              withSpotlight(
                <Pressable
                  onPress={onPressBack}
                  className="flex-row items-center px-4 py-2 rounded-xl border-2 border-outline bg-level2 active:opacity-70"
                >
                  <ArrowLeft color={colors.muted} size={24} />
                  <Text className="text-muted text-default-1 ml-2">{t("common.back")}</Text>
                </Pressable>,
                backSpotlightKey,
              )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}