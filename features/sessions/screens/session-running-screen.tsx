import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Check } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import { ActivityResultModal } from "../../exercises/components/activity-result-modal";
import { MabcResultModal } from "../../exercises/components/mabc-result-modal";
import { StartActivity } from "../../exercises/components/start-activity";
import { Stopwatch } from "../../exercises/components/stopwatch";
import { CircuitType } from "../../exercises/hooks/use-circuits";
import {
  DEFAULT_FINISH_MOTIVOS,
  FinishSessionModal,
} from "../components/finish-session-modal";
import { ReorderItem, ReorderModal } from "../components/reorder-modal";
import type {
  ExecutionRecord,
  MotivoNaoRealizacao,
} from "../hooks/use-session-flow";

/**
 * Maps the human-readable reasons surfaced by the result modals to the
 * `motivo_nao_realizacao_enum` values stored in the database.
 */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

export type SessionExercise = {
  id: string;
  name: string;
  description: string;
  mediaUrls?: string[];
};

type ExerciseStage = "ready" | "running";

const MOCK_EXERCISES: SessionExercise[] = [
  {
    id: "1",
    name: "Girar bambolê",
    description: "Rotacionar bambolê com o braço",
    mediaUrls: [],
  },
  {
    id: "2",
    name: "Equilíbrio na tábua",
    description: "Caminhar sobre tábua em linha reta",
    mediaUrls: [],
  },
  {
    id: "3",
    name: "Escalada",
    description: "Escalar parede",
    mediaUrls: [],
  },
];

export type SessionRunningScreenProps = {
  studentName: string;
  circuitName?: string;
  circuitType?: CircuitType;
  exercises?: SessionExercise[];
  onPressBack?: () => void;
  onFinishSession?: (motivo: string, executions: ExecutionRecord[]) => void;
  onCompleteSession?: (
    hasWarnings: boolean,
    executions: ExecutionRecord[],
  ) => void;
};

/**
 * Drives a running circuit. Holds the current exercise stage (StartActivity vs
 * Stopwatch), the playback order, and the two modals (reorder, finish session).
 *
 * Once any exercise has been executed (i.e. the user advanced past the first),
 * the header swaps to the "finish" variant so the user can early-terminate the
 * session via the FinishSessionModal.
 */
export function SessionRunningScreen({
  studentName,
  circuitName = "Circuito",
  circuitType = "padrao",
  exercises = MOCK_EXERCISES,
  onPressBack,
  onFinishSession,
  onCompleteSession,
}: SessionRunningScreenProps) {
  const [order, setOrder] = useState<SessionExercise[]>(exercises);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<ExerciseStage>("ready");
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string | undefined>();
  const [deferredExercises, setDeferredExercises] = useState<string[]>([]);
  const [historicoExercicios, setHistoricoExercicios] = useState<
    Record<string, "concluido" | "nao_realizada" | "adiado">
  >({});

  // Accumulates the persisted execution records across exercises so the parent
  // route can write them all once the session completes/finishes. A ref avoids
  // stale-closure issues while advancing through the queue.
  const executionsRef = useRef<ExecutionRecord[]>([]);
  // Elapsed seconds captured at the last stopwatch stop, persisted per exercise.
  const lastElapsedSecondsRef = useRef<number | null>(null);

  const isMabc =
    circuitType === "mabc_1" ||
    circuitType === "mabc_2" ||
    circuitType === "mabc_3";

  // States and refs for Success Toast feedback
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  const triggerToast = () => {
    setShowSuccessToast(true);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(toastTranslateY, {
            toValue: 20,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowSuccessToast(false);
        });
      }, 2500);
    });
  };

  const handleActivityNotCompleted = (motivo: string, descricao?: string) => {
    setIsResultModalOpen(false);
    triggerToast();
    advanceSession("nao_realizada", {
      statusRealizacao: "nao_realizada",
      motivoNaoRealizacao: MOTIVO_NAO_REALIZACAO_MAP[motivo] ?? "outro",
      descricaoAdicional: descricao ?? null,
      duracaoRealSegundos: lastElapsedSecondsRef.current,
    });
  };

  const handleActivityDefer = () => {
    setIsResultModalOpen(false);
    advanceSession("adiado");
  };

  const handleMabcConfirm = (_result: any) => {
    setIsResultModalOpen(false);
    triggerToast();
    advanceSession("concluido", {
      statusRealizacao: "realizada",
      duracaoRealSegundos: lastElapsedSecondsRef.current,
    });
  };

  const handleMabcDefer = () => {
    const updatedDeferred = [...deferredExercises, currentExercise.id];
    setDeferredExercises(updatedDeferred);
    setIsResultModalOpen(false);
    advanceSession("adiado");
  };

  const handleMabcNotCompleted = (motivo: string, descricao?: string) => {
    setIsResultModalOpen(false);
    triggerToast();
    advanceSession("nao_realizada", {
      statusRealizacao: "nao_realizada",
      motivoNaoRealizacao: MOTIVO_NAO_REALIZACAO_MAP[motivo] ?? "outro",
      descricaoAdicional: descricao ?? null,
      duracaoRealSegundos: lastElapsedSecondsRef.current,
    });
  };

  const advanceSession = (
    statusAtual: "concluido" | "nao_realizada" | "adiado",
    record?: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ) => {
    setStage("ready");
    setHasAdvanced(true);

    const historicoAtualizado = {
      ...historicoExercicios,
      [currentExercise.id]: statusAtual,
    };

    setHistoricoExercicios(historicoAtualizado);

    // Deferred ("adiado") exercises have no DB execution; only realized or
    // not-realized attempts are persisted.
    if (record) {
      executionsRef.current = [
        ...executionsRef.current,
        {
          exercicioId: currentExercise.id,
          ordemExecucao: currentIndex + 1,
          ...record,
        },
      ];
    }

    // Reset the captured stopwatch value for the next exercise.
    lastElapsedSecondsRef.current = null;

    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const temPendencias =
        Object.values(historicoAtualizado).includes("adiado");
      onCompleteSession?.(temPendencias, executionsRef.current);
    }
  };

  const total = order.length;
  const currentExercise = order[currentIndex];
  const subtitle = `${circuitName} - ${currentIndex + 1}/${total}`;

  const handleStart = () => setStage("running");
  const handleStartAndRecord = () => {
    // TODO: kick off media recording before starting the stopwatch.
    setStage("running");
  };

  const handleStop = (elapsed: number) => {
    lastElapsedSecondsRef.current = elapsed;

    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");

    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleConfirmFinish = (motivo: string) => {
    onFinishSession?.(motivo, executionsRef.current);
    setIsFinishOpen(false);
  };

  const handleConfirmReorder = (reorderedRemaining: ReorderItem[]) => {
    // Stitch the upcoming part of the queue back together with the already
    // executed/locked prefix in front of the current index.
    const upcomingById = new Map(
      order.slice(currentIndex).map((exercise) => [exercise.id, exercise]),
    );
    const reorderedUpcoming = reorderedRemaining
      .map((item) => upcomingById.get(item.id))
      .filter((exercise): exercise is SessionExercise => Boolean(exercise));
    setOrder([...order.slice(0, currentIndex), ...reorderedUpcoming]);
    setIsReorderOpen(false);
  };

  const reorderItems: ReorderItem[] = order
    .slice(currentIndex)
    .map((exercise) => ({ id: exercise.id, name: exercise.name }));

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant={hasAdvanced ? "finish" : "back"}
        onPressBack={onPressBack}
        onPressFinish={() => setIsFinishOpen(true)}
      />

      <View className="flex-1">
        <View className="mx-8 mt-5">
          <PageHeader
            mode="execucao"
            title={`Sessão de ${studentName}`}
            subtitle={subtitle}
            totalExercises={total}
            completedExercises={currentIndex}
            isExecuting={stage === "running"}
          />
        </View>

        <ScrollView
          className="mt-5 px-8"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {stage === "ready" ? (
            <StartActivity
              title={currentExercise.name}
              subtitle={currentExercise.description}
              mediaUrls={currentExercise.mediaUrls ?? []}
              onStart={handleStart}
              onStartAndRecord={handleStartAndRecord}
              onPressInfo={() => setIsReorderOpen(true)}
            />
          ) : (
            <Stopwatch
              title={currentExercise.name}
              subtitle={currentExercise.description}
              autoStart
              variant="form"
              onPressCrise={() => {
                /* TODO: register a "crise" event tied to the current exercise. */
              }}
              onStop={handleStop}
              onPressCorner={() => {
                // Error text
                throw new Error(
                  "Módulo de formulários (ATA/CARS) pendente de implementação!",
                );
              }}
            />
          )}

          {/*
            TODO: form questions section (Contato visual com pessoas, etc.)
            is out of scope here — wire to features/forms once available.
            Placeholder block kept so the layout reflects the design intent.
          */}
          {stage === "running" && (
            <View className="mt-5 items-center justify-center rounded-2xl border border-outline bg-level2 p-6">
              <Text className="text-center text-default-2 text-muted">
                Perguntas do formulário aparecerão aqui.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <ReorderModal
        visible={isReorderOpen}
        items={reorderItems}
        onClose={() => setIsReorderOpen(false)}
        onConfirm={handleConfirmReorder}
      />

      <FinishSessionModal
        visible={isFinishOpen}
        motivos={DEFAULT_FINISH_MOTIVOS}
        onClose={() => setIsFinishOpen(false)}
        onConfirm={handleConfirmFinish}
      />

      {isMabc ? (
        <MabcResultModal
          visible={isResultModalOpen}
          exerciseName={currentExercise.name}
          circuitType={circuitType as "mabc_1" | "mabc_2" | "mabc_3"}
          onClose={() => setIsResultModalOpen(false)}
          onDefer={() => {
            setIsResultModalOpen(false);
            advanceSession("adiado");
          }}
          onNotCompleted={handleMabcNotCompleted}
          onConfirm={handleMabcConfirm}
        />
      ) : (
        <ActivityResultModal
          visible={isResultModalOpen}
          exerciseTitle={currentExercise.name}
          elapsedTime={elapsedTimeStr}
          onClose={() => setIsResultModalOpen(false)}
          onDefer={handleActivityDefer}
          onNotCompleted={handleActivityNotCompleted}
          onConfirm={(result) => {
            setIsResultModalOpen(false);
            triggerToast();
            advanceSession("concluido", {
              statusRealizacao: "realizada",
              nivelDesenvolvimento: result.nivelDesenvolvimento,
              registroAjuda: result.registroAjuda,
              complementosAjuda: result.subCategorias,
              duracaoRealSegundos: lastElapsedSecondsRef.current,
            });
          }}
        />
      )}

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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Check size={20} color="#34C759" strokeWidth={3} />
          <Text
            style={{
              fontFamily: "Inter-Medium",
              fontSize: 14,
              color: "#fff",
              flex: 1,
            }}
          >
            Registro atualizado
          </Text>
        </Animated.View>
      )}

      <Footer />
    </View>
  );
}
