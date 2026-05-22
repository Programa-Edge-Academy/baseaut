import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { StartActivity } from "../../exercises/components/start-activity";
import { Stopwatch } from "../../exercises/components/stopwatch";
import {
  DEFAULT_FINISH_MOTIVOS,
  FinishSessionModal,
} from "../components/finish-session-modal";
import { ReorderItem, ReorderModal } from "../components/reorder-modal";

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
  exercises?: SessionExercise[];
  onPressBack?: () => void;
  onFinishSession?: (motivo: string) => void;
  onCompleteSession?: () => void;
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

  const total = order.length;
  const currentExercise = order[currentIndex];
  const subtitle = `${circuitName} - ${currentIndex + 1}/${total}`;

  const handleStart = () => setStage("running");
  const handleStartAndRecord = () => {
    // TODO: kick off media recording before starting the stopwatch.
    setStage("running");
  };

  const handleStop = (_elapsed: number) => {
    // TODO: persist elapsed seconds to execucoes_exercicio.
    setStage("ready");
    setHasAdvanced(true);
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onCompleteSession?.();
    }
  };

  const handleConfirmFinish = (motivo: string) => {
    onFinishSession?.(motivo);
    setIsFinishOpen(false);
  };

  const handleConfirmReorder = (reorderedRemaining: ReorderItem[]) => {
    // Stitch the upcoming part of the queue back together with the already
    // executed/locked prefix in front of the current index.
    const upcomingById = new Map(
      order.slice(currentIndex).map((exercise) => [exercise.id, exercise])
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
                /* TODO: open the per-exercise form sheet. */
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

      <Footer />

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
    </View>
  );
}
