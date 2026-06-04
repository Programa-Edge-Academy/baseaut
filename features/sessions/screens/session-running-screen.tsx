import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { FormComponent } from "@/features/forms/components/form-component";
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
import { ReorderModal } from "../components/reorder-modal";

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
  sessionId: string;
  studentId: string;
  studentName: string;
  circuitName?: string;
  circuitType?: CircuitType;
  exercises?: SessionExercise[];
  onPressBack?: () => void;
  onFinishSession?: (motivo: string) => void;
  onCompleteSession?: (hasWarnings: boolean) => void;
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
  sessionId,
  studentId,
  studentName,
  circuitName = "Circuito",
  circuitType = "padrao",
  exercises = MOCK_EXERCISES,
  onPressBack,
  onFinishSession,
  onCompleteSession,
}: SessionRunningScreenProps) {
  const formRef = useRef<any>(null);
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
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

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
    console.log(
      "[ActivityResult] Não realizada. Motivo:",
      motivo,
      "Descrição:",
      descricao,
    );
    setIsResultModalOpen(false);
    triggerToast();
    advanceSession("nao_realizada");
  };

  const handleActivityDefer = () => {
    console.log("[ActivityResult] Resposta adiada.");

    setIsResultModalOpen(false);

    advanceSession("adiado");
  };

  const handleMabcConfirm = (result: any) => {
    console.log("[MabcResult] Confirmado:", result);
    setIsResultModalOpen(false);
    triggerToast();
    advanceSession("concluido");
  };

  const handleMabcDefer = () => {
    console.log("[MabcResult] Resposta adiada.");
    const updatedDeferred = [...deferredExercises, currentExercise.id];
    setDeferredExercises(updatedDeferred);
    setIsResultModalOpen(false);
    advanceSession("adiado");
  };

  const handleMabcNotCompleted = (motivo: string, descricao?: string) => {
    console.log(
      "[MabcResult] Não realizada. Motivo:",
      motivo,
      "Descrição:",
      descricao,
    );
    setIsResultModalOpen(false);
    triggerToast();
    advanceSession("nao_realizada");
  };

  const advanceSession = (
    statusAtual: "concluido" | "nao_realizada" | "adiado",
  ) => {
    setStage("ready");
    setHasAdvanced(true);

    const historicoAtualizado = {
      ...historicoExercicios,
      [currentExercise.id]: statusAtual,
    };

    setHistoricoExercicios(historicoAtualizado);

    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const temPendencias =
        Object.values(historicoAtualizado).includes("adiado");
      if (formRef.current) {
        formRef.current.handleSave();
      }
      onCompleteSession?.(temPendencias);
    }
  };

  const handleSwapClick = (indexClicked: number) => {
    if (swapIndex === null) {
      setSwapIndex(indexClicked); // 
    } else if (swapIndex === indexClicked) {
      setSwapIndex(null); 
    } else {

      setOrder((prev) => {
        const newList = [...prev];
        const temp = newList[swapIndex];
        newList[swapIndex] = newList[indexClicked];
        newList[indexClicked] = temp;
        return newList;
      });
      setSwapIndex(null); 
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
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");

    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleConfirmFinish = (motivo: string) => {
    if (formRef.current) {
      formRef.current.handleSave();
    }
    onFinishSession?.(motivo);
    setIsFinishOpen(false);
  };

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
          <FormComponent
            ref={formRef}
            formularioId={"00000000-0000-4000-0000-0000000000fc"}
            sessaoId={sessionId}
            alunoId={studentId}
          />
        </ScrollView>
      </View>

      <ReorderModal
        visible={isReorderOpen}
        items={order} // Passamos a lista completa
        currentIndex={currentIndex} // Informamos qual exercício está rodando agora
        swapIndex={swapIndex} // O estado de quem está "esperando" a troca
        onClose={() => setIsReorderOpen(false)}
        onItemPress={handleSwapClick} // A nossa função de Swap que criamos no passo anterior
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
            console.log("[ActivityResult]", result);
            setIsResultModalOpen(false);
            triggerToast();
            advanceSession("concluido");
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
