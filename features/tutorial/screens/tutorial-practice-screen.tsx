import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SelectableChip } from "@/components/selectable-chip";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { buildTutorialModules } from "@/features/tutorial/constants/modules";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, Info, Pause, Play, Timer } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** A lightweight, self-contained mock stopwatch for the sessions practice. */
function MockStopwatch() {
  const colors = useThemeColors();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <Pressable
      onPress={() => setRunning((r) => !r)}
      className="h-12 flex-row items-center justify-center gap-3 rounded-2xl border border-outline bg-content/5 active:opacity-70"
    >
      <Timer size={22} color={colors.muted} />
      <Text
        className="text-content"
        style={{ fontFamily: "Inter-Bold", fontSize: 26, fontVariant: ["tabular-nums"] }}
      >
        {mm}:{ss}
      </Text>
      {running ? (
        <Pause size={20} color={colors.muted} />
      ) : (
        <Play size={20} color={colors.muted} />
      )}
    </Pressable>
  );
}

/**
 * Interactive practice sandbox opened from a tutorial step's "Simular" action.
 * It renders a local, mocked replica of the feature described by the step so
 * the user can actually perform the action — filling fields, toggling options
 * and confirming — with no connection to the database.
 *
 * @remarks
 * The header carries the "Em tutorial" banner ({@link Header} `variant="tutorial"`)
 * which opens a formal notice explaining that everything here is practice-only.
 * The back button returns to the originating step.
 */
export function TutorialPracticeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useI18n();
  const { moduleId, stepIndex } = useLocalSearchParams<{
    moduleId: string;
    stepIndex: string;
  }>();

  const modules = useMemo(() => buildTutorialModules(t), [t]);
  const module = useMemo(
    () => modules.find((m) => m.id === moduleId),
    [modules, moduleId],
  );
  const step = module?.steps[Number(stepIndex) || 0];

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (step?.mock ?? []).forEach((row) => {
      initial[row.label] = row.value;
    });
    return initial;
  });
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  if (!module || !step) {
    return (
      <View className="flex-1 bg-level1">
        <Header variant="back" onPressBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-default-1 text-content text-center">
            {t("tutorial.practiceNotFound")}
          </Text>
        </View>
      </View>
    );
  }

  const isSession = module.id === "sessoes";

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="tutorial"
        onPressBack={() => router.back()}
        onPressFinish={() => setNoticeOpen(true)}
      />

      <ScrollView
        className="flex-1 px-8"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-5 w-full">
          <PageHeader title={module.title} subtitle={t("tutorial.practiceArea")} />
        </View>

        <Pressable
          onPress={() => setNoticeOpen(true)}
          className="mt-4 flex-row items-center gap-2 rounded-2xl border border-primary bg-primary/10 p-3 active:opacity-70"
        >
          <Info size={18} color={colors.primary} />
          <Text className="flex-1 text-default-2 text-primary">
            {t("tutorial.practiceEnvBanner")}
          </Text>
        </Pressable>

        <View className="mt-5 rounded-2xl border border-outline bg-level2 p-5 gap-4">
          <Text className="text-header-3 text-content">{step.title}</Text>
          <Text className="text-default-2 text-muted leading-6">{step.body}</Text>

          {(step.mock ?? []).map((row) => (
            <View key={row.label} className="gap-1">
              <Text className="text-default-2 text-muted">{row.label}</Text>
              <DefaultTextInput
                value={fields[row.label] ?? ""}
                onChangeText={(text) =>
                  setFields((prev) => ({ ...prev, [row.label]: text }))
                }
                className="h-11 w-full rounded-[15px]"
              />
            </View>
          ))}

          {isSession && (
            <View className="gap-2">
              <Text className="text-default-2 text-muted">{t("tutorial.stopwatchPractice")}</Text>
              <MockStopwatch />
            </View>
          )}

          {module.id === "exercicios" && (
            <View className="gap-2">
              <Text className="text-default-2 text-muted">{t("tutorial.selectTag")}</Text>
              {[
                { key: "coordenacao", label: t("tags.coordenacao") },
                { key: "forca", label: t("tags.forca") },
                { key: "equilibrio", label: t("tags.equilibrio") },
              ].map((tag) => (
                <SelectableChip
                  key={tag.key}
                  label={tag.label}
                  isSelected={!!confirmed[tag.key]}
                  onToggle={() =>
                    setConfirmed((prev) => ({ ...prev, [tag.key]: !prev[tag.key] }))
                  }
                />
              ))}
            </View>
          )}
        </View>

        {done ? (
          <View className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border border-secondary bg-secondary/10 py-3">
            <CheckCircle2 size={18} color={colors.secondary} />
            <Text className="text-default-1 text-secondary">
              {t("tutorial.practiceDone")}
            </Text>
          </View>
        ) : (
          <DefaultButton
            label={step.action ?? t("tutorial.finishPractice")}
            onPress={() => setDone(true)}
            sizeClass="w-full h-12"
            className="mt-4"
          />
        )}

        {done && (
          <DefaultButton
            label={t("tutorial.backToTutorial")}
            onPress={() => router.back()}
            sizeClass="w-full h-11"
            className="mt-3"
            bgColorClass="bg-level2"
            hasShadow={false}
            isOutline
            outlineBorderClass="border-outline"
            textClassName="text-content"
          />
        )}
      </ScrollView>

      <AppModal
        visible={noticeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNoticeOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={() => setNoticeOpen(false)}
        >
          <Pressable
            className="w-full max-w-[420px] rounded-2xl border border-outline bg-level2 p-5 gap-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-xl bg-primary/15 p-2">
                <Info size={24} color={colors.primary} />
              </View>
              <Text className="text-header-2 text-content flex-1">
                {t("tutorial.practiceEnvTitle")}
              </Text>
            </View>
            <Text className="text-default-2 text-muted leading-6">
              {t("tutorial.practiceNoticeLong")}
            </Text>
            <DefaultButton
              label={t("common.gotIt")}
              onPress={() => setNoticeOpen(false)}
              sizeClass="w-full h-11"
            />
          </Pressable>
        </Pressable>
      </AppModal>
    </View>
  );
}
