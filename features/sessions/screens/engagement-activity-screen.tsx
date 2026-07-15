import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { StartActivity } from "@/features/exercises/components/start-activity";
import { Stopwatch } from "@/features/exercises/components/stopwatch";
import {
  ActivityResultModal,
  ActivityResultData,
} from "@/features/exercises/components/activity-result-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { resolveEngagementExerciseId } from "@/lib/resolve-engagement-exercise";
import { supabase } from "@/lib/supabase";
import {
  useSessionFlow,
  type ExecutionRecord,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";
import { formatSessionClock, useSessionGlobalContext } from "../contexts/session-global-context";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";

/** Maps the result modal's labels to the `motivo_nao_realizacao_enum` values. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

/**
 * Runs an engagement activity within a semi-structured session. It records each
 * activity as an execution of the team's invisible engagement sentinel exercise
 * (also logging an "engajamento" behavior), and returns to the session afterward.
 */
export function EngagementActivityScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { studentName, sessionId, studentId, fromWidget } = useLocalSearchParams<{
    studentName: string;
    studentId: string;
    sessionId: string;
    fromWidget?: string;
  }>();
  const safeStudentName = studentName || t("common.student");

  const { persistExecutions } = useSessionFlow();
  const {
    activeSessions,
    updateSessionState,
    updateSessionProgress,
    toggleTimer,
    setTimerVisible,
    updateTimeElapsed,
  } = useSessionGlobalContext();

  const engagementExerciseIdRef = useRef<string | null>(null);
  const ordemRef = useRef(0);
  const lastElapsedSecondsRef = useRef<number | null>(null);

  const currentSessionData = activeSessions[sessionId || ""];
  const isEngagementRunning = currentSessionData?.isEngagementRunning ?? false;

  useEffect(() => {
    let active = true;
    resolveEngagementExerciseId().then((id) => {
      if (active) engagementExerciseIdRef.current = id;
    });
    return () => {
      active = false;
    };
  }, []);

  const [stage, setStage] = useState<"ready" | "running">(() => {
    return isEngagementRunning ? "running" : "ready";
  });
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setTimerVisible(sessionId, true);
    return () => setTimerVisible(sessionId, false);
  }, [sessionId, setTimerVisible]);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string | undefined>();

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  const triggerToastAndBack = () => {
    setShowSuccessToast(true);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.timing(toastTranslateY, { toValue: 20, duration: 350, useNativeDriver: true }),
        ]).start(() => {
          setShowSuccessToast(false);
          if (fromWidget === "true" && currentSessionData) {
            router.replace({
              pathname: "/session/semi-structured",
              params: {
                sessionId: currentSessionData.sessionId,
                studentId: currentSessionData.studentId,
                studentName: currentSessionData.studentName,
                circuitId: currentSessionData.circuitId || "",
                circuitName: currentSessionData.circuitName || t("common.circuit"),
                queue: currentSessionData.exercisesJson || "[]",
              },
            });
          } else {
            router.back();
          }
        });
      }, 2000);
    });
  };

  const handleStop = (elapsed: number) => {
    if (sessionId) toggleTimer(sessionId, false);
    lastElapsedSecondsRef.current = elapsed;
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  /** Saves an engagement activity as an execution of the sentinel exercise. */
  const persistEngagement = async (
    record: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ): Promise<string | null> => {
    const exercicioId = engagementExerciseIdRef.current;
    if (!sessionId || !exercicioId) return null;
    ordemRef.current += 1;
    try {
      const inserted = await persistExecutions(sessionId, [
        {
          exercicioId,
          ordemExecucao: ordemRef.current,
          ...record,
        },
      ]);
      return inserted[0]?.id ?? null;
    } catch {
      return null;
    }
  };

  const handleResult = async (
    status: "concluido" | "nao_realizada" | "adiado",
    options?: { motivo?: string; descricao?: string; result?: ActivityResultData },
  ) => {
    const duracao = lastElapsedSecondsRef.current;

    if (status === "concluido") {
      const execId = await persistEngagement({
        statusRealizacao: "realizada",
        nivelDesenvolvimento: options?.result?.nivelDesenvolvimento ?? null,
        registroAjuda: options?.result?.registroAjuda ?? null,
        complementosAjuda: options?.result?.subCategorias ?? null,
        duracaoRealSegundos: duracao,
      });
      if (sessionId && execId) {
        await supabase.from("comportamentos_sessao").insert({
          sessao_id: sessionId,
          execucao_id: execId,
          tipo: "engajamento",
          duracao_segundos: duracao != null ? Math.round(duracao) : null,
        });
      }
    } else if (status === "nao_realizada") {
      void persistEngagement({
        statusRealizacao: "nao_realizada",
        motivoNaoRealizacao:
          MOTIVO_NAO_REALIZACAO_MAP[options?.motivo ?? ""] ?? "outro",
        descricaoAdicional: options?.descricao ?? null,
        duracaoRealSegundos: duracao,
      });
    } else {
      void persistEngagement({
        statusRealizacao: "adiado",
        duracaoRealSegundos: duracao,
      });
    }

    if (sessionId) {
      updateSessionState(sessionId, { activeExerciseId: null, isEngagementRunning: false });
    }

    lastElapsedSecondsRef.current = null;
    setIsResultModalOpen(false);
    triggerToastAndBack();
  };

  const handleStart = () => {
    setStage("running");
    if (!sessionId) return;
    updateSessionState(sessionId, {
      activeExerciseId: engagementExerciseIdRef.current,
      isEngagementRunning: true,
    });
    updateSessionProgress(sessionId, t("engagement.title"));
    updateTimeElapsed(sessionId, 0);
    toggleTimer(sessionId, true);
  };

  const handleConfirmFinish = () => {
    setIsFinishModalOpen(false);
    triggerToastAndBack();
  };

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant={stage === "running" ? "finishEngagement" : "back"}
        onPressBack={() => router.back()}
        onPressFinish={() => setIsFinishModalOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-8 mt-5">
          <PageHeader
            title={t("sessions.circuitSelection.title").replace("{name}", safeStudentName)}
            subtitle={t("session.subtitleEngagement").replace("{clock}", formatSessionClock(currentSessionData?.totalElapsed ?? 0))}
          />
        </View>

        <View className="top-[4%] p-5 rounded-2xl w-[100%] justify-center align-center">
          {stage === "ready" ? (
            <StartActivity
              title={t("engagement.title")}
              subtitle={t("engagement.subtitle")}
              onStart={handleStart}
              onStartAndRecord={handleStart}
            />
          ) : (
            <Stopwatch
              title={t("engagement.title")}
              subtitle={t("engagement.subtitle")}
              autoStart={true}
              controlledSeconds={currentSessionData?.timeElapsed ?? 0}
              controlledIsRunning={currentSessionData?.isRunning ?? false}
              variant="minimize"
              className="bg-level2"
              onStop={handleStop}
              onToggleRunning={(isRunning) => {
                if (sessionId) toggleTimer(sessionId, isRunning);
              }}
              onPressCrise={() => {}}
              onPressCorner={() => router.back()}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isFinishModalOpen}
        mode="finishEngagement"
        onClose={() => setIsFinishModalOpen(false)}
        onConfirm={handleConfirmFinish}
      />

      <ActivityResultModal
        visible={isResultModalOpen}
        exerciseTitle={t("engagement.title")}
        elapsedTime={elapsedTimeStr}
        onClose={() => setIsResultModalOpen(false)}
        onDefer={() => handleResult("adiado")}
        onNotCompleted={(motivo, desc) =>
          handleResult("nao_realizada", { motivo, descricao: desc })
        }
        onConfirm={(result) => handleResult("concluido", { result })}
      />

          {showSuccessToast && (
            <Animated.View
              style={{
                position: "absolute",
                bottom: 100,
                left: 20,
                right: 20,
                backgroundColor: "rgba(52, 199, 89, 0.25)",
                borderColor: "#34C759",
                borderWidth: 1,
                borderRadius: 15,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                opacity: toastOpacity,
                transform: [{ translateY: toastTranslateY }],
                zIndex: 999
              }}
            >
              <CheckCircle2 size={20} color="#34C759" strokeWidth={3} />
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: "#fff", flex: 1 }}>
                Registro atualizado
              </Text>
            </Animated.View>
          )}
    </View>
  );
}

export default EngagementActivityScreen;