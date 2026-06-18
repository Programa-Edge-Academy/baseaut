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
import {
  useSessionFlow,
  type ExecutionRecord,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";

/** Mapeia os rótulos do modal de resultado para o motivo_nao_realizacao_enum. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

export function EngagementActivityScreen() {
  const router = useRouter();
  const { studentName, sessionId } = useLocalSearchParams<{
    studentName: string;
    studentId: string;
    sessionId: string;
  }>();
  const safeStudentName = studentName || "Aluno";

  const { persistExecutions } = useSessionFlow();
  // Id do exercício-sentinela de engajamento da equipe (resolvido na montagem).
  const engagementExerciseIdRef = useRef<string | null>(null);
  const ordemRef = useRef(0);
  const lastElapsedSecondsRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    resolveEngagementExerciseId().then((id) => {
      if (active) engagementExerciseIdRef.current = id;
    });
    return () => {
      active = false;
    };
  }, []);

  const [stage, setStage] = useState<"ready" | "running">("ready");
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
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
          router.back();
        });
      }, 2000);
    });
  };

  const handleStop = (elapsed: number) => {
    lastElapsedSecondsRef.current = elapsed;
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  // Grava a atividade de engajamento como uma execução (exercício-sentinela).
  const persistEngagement = async (
    record: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ) => {
    const exercicioId = engagementExerciseIdRef.current;
    if (!sessionId || !exercicioId) return;
    ordemRef.current += 1;
    try {
      await persistExecutions(sessionId, [
        {
          exercicioId,
          ordemExecucao: ordemRef.current,
          ...record,
        },
      ]);
    } catch (err) {
      console.error("Erro ao salvar atividade de engajamento:", err);
    }
  };

  const handleResult = (
    status: "concluido" | "nao_realizada" | "adiado",
    options?: { motivo?: string; descricao?: string; result?: ActivityResultData },
  ) => {
    const duracao = lastElapsedSecondsRef.current;

    if (status === "concluido") {
      void persistEngagement({
        statusRealizacao: "realizada",
        nivelDesenvolvimento: options?.result?.nivelDesenvolvimento ?? null,
        registroAjuda: options?.result?.registroAjuda ?? null,
        complementosAjuda: options?.result?.subCategorias ?? null,
        duracaoRealSegundos: duracao,
      });
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

    lastElapsedSecondsRef.current = null;
    setIsResultModalOpen(false);
    triggerToastAndBack();
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
            title={`Sessão de ${safeStudentName}`}
            subtitle="Circuito Semi-estruturado · Engajamento"
          />
        </View>

        <View className="top-[4%] p-5 rounded-2xl w-[100%] justify-center align-center">
          {stage === "ready" ? (
            <StartActivity
              title="Atividade de engajamento"
              subtitle="Momento focado na interação com o aluno"
              onStart={() => setStage("running")}
              onStartAndRecord={() => setStage("running")}
            />
          ) : (
            <Stopwatch
              title="Atividade de engajamento"
              subtitle="Momento focado na interação com o aluno"
              autoStart
              variant="minimize"
              className="bg-level2"
              onStop={handleStop}
              onToggleRunning={() => {}}
              onPressCrise={() => {}}
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
        exerciseTitle="Atividade de engajamento"
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