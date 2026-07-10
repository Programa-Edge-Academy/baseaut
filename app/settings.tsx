import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
// LAUNCH-GATE: language and tutorial sections are disabled for the public
// release (incomplete translations + buggy tutorial). Restore these imports
// together with the commented-out sections below once both are complete.
// import { LOCALE_OPTIONS } from "@/features/settings/constants/translations";
import { FeedbackModal } from "@/features/settings/components/feedback-modal";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { ThemeMode, useTheme, useThemeColors } from "@/features/settings/contexts/theme-context";
// import { useTutorial } from "@/features/tutorial/contexts/tutorial-context";
import { useRouter } from "expo-router";
// LAUNCH-GATE: `GraduationCap` and `Languages` re-add with the sections below.
import { Check, /* GraduationCap, Languages, */ MessageSquareText, Monitor, Moon, Sun } from "lucide-react-native";
import React, { useState } from "react";
// LAUNCH-GATE: `Switch` re-add with the tutorial section below.
import { Pressable, ScrollView, /* Switch, */ Text, View } from "react-native";

/** A single selectable option row with a leading icon and a trailing check. */
function OptionRow({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between rounded-2xl border bg-level1 p-4 active:opacity-70 ${
        selected ? "border-primary" : "border-outline"
      }`}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-default-1 text-content">{label}</Text>
      </View>
      {selected && <Check size={18} color={colors.primary} />}
    </Pressable>
  );
}

/**
 * Settings screen exposing the app appearance (theme: system/light/dark) and a
 * feedback channel to the development team (via {@link FeedbackModal}). The
 * theme defaults to the device setting and is persisted; logout lives on the
 * account page.
 */
export default function SettingsRoute() {
  const router = useRouter();
  const colors = useThemeColors();
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  // LAUNCH-GATE: language + tutorial controls disabled for the public release.
  // Restore these with the commented-out sections below.
  // const { preference, setPreference } = useI18n();
  // const { hidden: tutorialHidden, setHidden: setTutorialHidden } = useTutorial();

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "system", label: t("settings.theme.system"), icon: <Monitor size={18} color={colors.muted} /> },
    { value: "light", label: t("settings.theme.light"), icon: <Sun size={18} color={colors.muted} /> },
    { value: "dark", label: t("settings.theme.dark"), icon: <Moon size={18} color={colors.muted} /> },
  ];

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView
        className="flex-1 px-8"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mt-5 w-full">
          <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
        </View>

        <View className="mt-8 gap-4">
          <Text className="text-header-3 text-content">{t("settings.appearance")}</Text>
          <View className="gap-2.5">
            {themeOptions.map((opt) => (
              <OptionRow
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                selected={mode === opt.value}
                onPress={() => setMode(opt.value)}
              />
            ))}
          </View>
        </View>

        <View className="mt-8 gap-4">
          <Text className="text-header-3 text-content">{t("settings.feedback")}</Text>
          <Pressable
            onPress={() => setFeedbackVisible(true)}
            className="flex-row items-center gap-3 rounded-2xl border border-outline bg-level1 p-4 active:opacity-70"
          >
            <MessageSquareText size={18} color={colors.muted} />
            <View className="flex-1">
              <Text className="text-default-1 text-content">{t("settings.feedback.button")}</Text>
              <Text className="text-default-3 text-muted">{t("settings.feedback.buttonHint")}</Text>
            </View>
          </Pressable>
        </View>

        {/*
          LAUNCH-GATE: language selection disabled for the public release —
          the English (and any future) catalog is still incomplete, so the app
          ships in the device/default locale with no in-app switcher. Restore
          this whole section (and the imports/hooks above) once translations
          are complete.

        <View className="mt-8 gap-4">
          <Text className="text-header-3 text-content">{t("settings.language")}</Text>
          <Text className="text-default-2 text-muted">
            {t("settings.language.description")}
          </Text>
          <View className="gap-2.5">
            {LOCALE_OPTIONS.map((opt) => (
              <OptionRow
                key={opt.value}
                label={opt.label}
                icon={<Languages size={18} color={colors.muted} />}
                selected={preference === opt.value}
                onPress={() => setPreference(opt.value)}
              />
            ))}
          </View>
        </View>
        */}

        {/*
          LAUNCH-GATE: tutorial section disabled for the public release — the
          guided tutorial is still buggy. Restore this whole section (and the
          imports/hooks above) once the tutorial is finished.

        <View className="mt-8 gap-4">
          <Text className="text-header-3 text-content">{t("settings.tutorial")}</Text>

          <Pressable
            onPress={() => router.push("/tutorial" as never)}
            className="flex-row items-center justify-between rounded-2xl border border-outline bg-level1 p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <GraduationCap size={18} color={colors.muted} />
              <Text className="text-default-1 text-content">{t("settings.openTutorial")}</Text>
            </View>
          </Pressable>

          <View className="flex-row items-center justify-between rounded-2xl border border-outline bg-level1 p-4">
            <View className="flex-1 pr-3">
              <Text className="text-default-1 text-content">{t("settings.showTutorialButton")}</Text>
              <Text className="text-default-3 text-muted">{t("settings.showTutorialButtonHint")}</Text>
            </View>
            <Switch
              value={!tutorialHidden}
              onValueChange={(next) => setTutorialHidden(!next)}
              trackColor={{ true: colors.primary, false: colors.outline }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        */}
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />
    </View>
  );
}
