import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import { buildTutorialModules } from "@/features/tutorial/constants/modules";
import {
  ANALISES_SIMULATION,
  FORMULARIOS_SIMULATION,
  HISTORICO_SIMULATION,
  RELATORIOS_SIMULATION,
  SESSOES_SIMULATION,
} from "@/features/tutorial/constants/simulations";
import { useTutorial } from "@/features/tutorial/contexts/tutorial-context";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PartyPopper, Play } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Plays a single tutorial module step by step. Steps always start from the
 * beginning; the "Anterior"/"Próximo" buttons move between them. Each step's
 * mock highlights are illustrative, and its "Simular" action opens an
 * interactive practice sandbox (see the tutorial-practice route). Completing
 * the last step marks the module done; finishing the final remaining module
 * shows a congratulations modal. Once every module is done the header shortcut
 * disappears on its own ({@link useTutorial} `allCompleted`), leaving Settings
 * as the only entry point.
 */
export function TutorialModuleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useI18n();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { completed, markCompleted, pendingStep, clearPendingStep, requestStep } =
    useTutorial();
  const sessionSim = useSessionSimController();

  const modules = useMemo(() => buildTutorialModules(t), [t]);
  const module = useMemo(
    () => modules.find((m) => m.id === moduleId),
    [modules, moduleId],
  );

  const [index, setIndex] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  // A completed simulation asks the module to jump to its wrap-up step.
  useEffect(() => {
    if (pendingStep && pendingStep.moduleId === moduleId) {
      setIndex(pendingStep.index);
      clearPendingStep();
    }
  }, [pendingStep, moduleId, clearPendingStep]);

  if (!module) {
    return (
      <View className="flex-1 bg-level1">
        <Header variant="back" onPressBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-default-1 text-content text-center">
            {t("tutorial.moduleNotFound")}
          </Text>
        </View>
      </View>
    );
  }

  const accent = colors[module.accent] ?? colors.primary;
  const step = module.steps[index];
  const isLast = index === module.steps.length - 1;
  const isFirst = index === 0;

  const goNext = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    markCompleted(module.id);
    const willComplete = new Set([...completed, module.id]);
    const finishedAll = modules.every((m) => willComplete.has(m.id));
    if (finishedAll) {
      setShowCongrats(true);
    } else {
      router.back();
    }
  };

  const goPrevious = () => {
    if (!isFirst) setIndex((i) => i - 1);
  };

  const handleFinishCongrats = () => {
    setShowCongrats(false);
    router.replace("/students");
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <View className="flex-1 px-8">
        <View className="mt-5">
          <Text className="text-header-1 text-content">{module.title}</Text>
        </View>

        <View className="mt-4 flex-row gap-1.5">
          {module.steps.map((_, i) => (
            <View
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ backgroundColor: i <= index ? accent : colors.outline }}
            />
          ))}
        </View>
        <Text className="mt-2 text-default-3 text-muted">
          {t("tutorial.stepOf").replace("{n}", String(index + 1)).replace("{total}", String(module.steps.length))}
        </Text>

        <ScrollView
          className="mt-5 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text className="text-header-2 text-content">{step.title}</Text>
          <Text className="mt-3 text-default-1 text-muted leading-6">{step.body}</Text>

          {step.mock && (
            <View className="mt-5 rounded-2xl border border-outline bg-level2 p-4 gap-3">
              {step.mock.map((row) => (
                <View key={row.label} className="flex-row items-center justify-between">
                  <Text className="text-default-2 text-muted">{row.label}</Text>
                  <Text className="text-default-2 text-content">{row.value}</Text>
                </View>
              ))}
            </View>
          )}

          {step.action && (
            <Pressable
              onPress={() => {
                const routeSimKinds: Record<string, "session" | "forms" | "history" | "analysis" | "reports"> = {
                  sessoes: "session",
                  formularios: "forms",
                  historico: "history",
                  analises: "analysis",
                  relatorios: "reports",
                };
                const routeSimSubSteps: Record<string, typeof SESSOES_SIMULATION> = {
                  sessoes: SESSOES_SIMULATION,
                  formularios: FORMULARIOS_SIMULATION,
                  historico: HISTORICO_SIMULATION,
                  analises: ANALISES_SIMULATION,
                  relatorios: RELATORIOS_SIMULATION,
                };
                if (routeSimKinds[module.id]) {
                  const returnModuleId = module.id;
                  sessionSim.start(routeSimKinds[module.id], routeSimSubSteps[module.id], () => {
                    requestStep(returnModuleId, index + 1);
                    // Unwind every real screen the simulation pushed and return to
                    // *this* module instance (which then jumps to its wrap-up step
                    // via the pending step). `navigate` would leave those screens
                    // in the stack and mount a duplicate module at step 0, breaking
                    // both module completion and the back stack.
                    router.dismissTo({
                      pathname: "/tutorial-module",
                      params: { moduleId: returnModuleId },
                    } as never);
                  });
                  if (module.id === "historico") {
                    router.push({ pathname: "/history" } as never);
                  } else if (module.id === "analises") {
                    router.push({ pathname: "/analysis" } as never);
                  } else if (module.id === "relatorios") {
                    router.push({ pathname: "/reports" } as never);
                  } else {
                    router.push({
                      pathname: "/circuit-selection",
                      params: { studentId: "mock-aluno", studentName: "Ana Beatriz" },
                    } as never);
                  }
                  return;
                }
                router.push({
                  pathname: "/tutorial-practice",
                  params: { moduleId: module.id, stepIndex: String(index) },
                } as never);
              }}
              className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border py-3 active:opacity-70"
              style={{ borderColor: accent, backgroundColor: `${accent}1A` }}
            >
              <Play size={16} color={accent} />
              <Text className="text-default-1" style={{ color: accent }}>
                {step.action}
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <View className="flex-row gap-3 pb-8 pt-2">
          {!isFirst && (
            <DefaultButton
              label={t("tutorial.previous")}
              onPress={goPrevious}
              sizeClass="flex-1 h-12"
              bgColorClass="bg-level2"
              hasShadow={false}
              isOutline
              outlineBorderClass="border-outline"
              textClassName="text-content"
            />
          )}
          {!step.requiresSimulation && (
            <DefaultButton
              label={isLast ? t("tutorial.finishModule") : t("tutorial.next")}
              onPress={goNext}
              sizeClass={isFirst ? "flex-1 h-12" : "flex-[2] h-12"}
            />
          )}
        </View>
      </View>

      <AppModal visible={showCongrats} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-[420px] items-center rounded-2xl border border-outline bg-level2 p-6 gap-4">
            <View className="rounded-2xl bg-secondary/15 p-4">
              <PartyPopper size={40} color={colors.secondary} />
            </View>
            <Text className="text-header-2 text-content text-center">
              {t("tutorial.congratsTitle")}
            </Text>
            <Text className="text-default-2 text-muted text-center leading-6">
              {t("tutorial.congratsBody")}
            </Text>
            <DefaultButton
              label={t("tutorial.startUsing")}
              onPress={handleFinishCongrats}
              sizeClass="w-full h-11"
            />
          </View>
        </View>
      </AppModal>
    </View>
  );
}
