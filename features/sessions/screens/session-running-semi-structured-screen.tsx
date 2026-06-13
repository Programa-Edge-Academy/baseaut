import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { ActivityResultModal } from "@/features/exercises/components/activity-result-modal";
import { StartActivity } from "@/features/exercises/components/start-activity";
import { Stopwatch } from "@/features/exercises/components/stopwatch";
import {
  DEFAULT_FINISH_MOTIVOS,
  FinishSessionModal,
} from "@/features/sessions/components/finish-session-modal";
import { SessionExercise } from "@/features/sessions/screens/session-running-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Split } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";

type ExerciseStage = "ready" | "running";

export type SessionRunningSemiStructuredProps = {
  studentName: string;
  exercises: SessionExercise[];
};

export function SessionRunningSemiStructuredScreen({
  studentName,
  exercises,
}: SessionRunningSemiStructuredProps) {
  const router = useRouter();
  

  const safeStudentName = studentName || "Aluno";

  const [activeExercise, setActiveExercise] = useState<SessionExercise | null>(null);
  const [stage, setStage] = useState<ExerciseStage>("ready");
  
  

  const [historicoExercicios, setHistoricoExercicios] = useState<
    Record<string, "concluido" | "nao_realizada" | "adiado">
  >({});

  const [elapsedTimeStr, setElapsedTimeStr] = useState<string | undefined>();
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);

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
        ]).start(() => setShowSuccessToast(false));
      }, 2500);
    });
  };

  const handleSelectExercise = (exercise: SessionExercise) => {
    setActiveExercise(exercise);
    setStage("ready");
  };

  const handleStop = (elapsed: number) => {
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleResult = (status: "concluido" | "nao_realizada" | "adiado") => {
    if (!activeExercise) return;

    const novoHistorico = {
      ...historicoExercicios,
      [activeExercise.id]: status,
    };
    setHistoricoExercicios(novoHistorico);

    setIsResultModalOpen(false);
    triggerToast();

    const pendentes = exercises.filter((ex) => !novoHistorico[ex.id]);

    if (pendentes.length === 0) {
      router.replace({
        pathname: "/session/completed",
        params: {
          type: "semi-structured",
          studentName: safeStudentName,
          fullCircuit: JSON.stringify(exercises),
          queue: JSON.stringify([]),
        },
      });
    } else {
      setActiveExercise(null);
    }
  };

  const handleFinishSession = (motivo: string) => {
    setIsFinishOpen(false);

    const filaDePendentes = exercises.filter((ex) => {
      const status = historicoExercicios[ex.id];
      return status !== "concluido" && status !== "adiado";
    });

    router.push({
      pathname: "/session/completed",
      params: {
        type: "semi-structured",
        studentName: safeStudentName,
        fullCircuit: JSON.stringify(exercises),
        queue: JSON.stringify(filaDePendentes),
      },
    });
  };

  if (exercises.length === 0) {
    return (
      <View className="flex-1 bg-level1">
        <Header
          variant="back"
          onPressBack={() => router.replace("/students")}
        />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-base text-center font-medium">
            Não foi possível carregar os exercícios do circuito.
          </Text>
        </View>
      </View>
    );
  }

  const renderExecutionView = () => {
    if (!activeExercise) return null;

    return (
      <View className="flex-1 mt-5 px-8">
        <PageHeader
          mode="execucao"
          title={`Sessão de ${safeStudentName}`}
          subtitle={`Exercício Livre`}
          totalExercises={1}
          completedExercises={0}
          isExecuting={stage === "running"}
        />
        <View className="mt-5">
          {stage === "ready" ? (
            <StartActivity
              title={activeExercise.name}
              subtitle={activeExercise.description}
              mediaUrls={activeExercise.mediaUrls ?? []}
              onStart={() => setStage("running")}
              onStartAndRecord={null}
            />
          ) : (
            <Stopwatch
              title={activeExercise.name}
              subtitle={activeExercise.description}
              autoStart
              variant="form"
              onStop={handleStop}
            />
          )}
        </View>
      </View>
    );
  };

  const renderListView = () => {
    return (
      <View className="flex-1">
        <View className="left-6 top-4 w-[264px] mb-8">
          <PageHeader
            title={`Sessão de ${safeStudentName}`}
            subtitle="Circuito Livre"
          />
        </View>

        <View className="mx-5 rounded-2xl bg-level1 border border-primary p-5">
          <View className="flex-row items-center justify-between gap-4 pb-5 mb-5 border-b border-outline">
            <View className="flex-1 space-y-1">
              <Text className="text-white text-base font-medium leading-5">
                Selecione o próximo exercício
              </Text>
              <Text className="text-muted text-sm font-medium leading-5">
                Para atividades de engajamento, pressione o botão amarelo ao lado
              </Text>
            </View>
            
            <Pressable 
              className="w-10 h-10 rounded-full bg-extra/10 border border-extra justify-center items-center flex-shrink-0 active:opacity-70"
              onPress={() => {
                router.push({
                  pathname: "/session/engagement", 
                  params: { studentName: safeStudentName }
                });
              }}
            >
              <Split color={colors.extra} size={24} />
            </Pressable>
          </View>

          <View className="gap-2.5">
            {exercises.map((exercise) => {
              const status = historicoExercicios[exercise.id];
              const isConcluido = status === "concluido" || status === "adiado";
              return (
                <Pressable
                  key={exercise.id}
                  disabled={isConcluido}
                  className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 ${
                    isConcluido
                      ? "bg-[#34C759]/10 border-[#34C759] opacity-70"
                      : "bg-level2 border-outline"
                  }`}
                  onPress={() => handleSelectExercise(exercise)}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className={`text-base font-medium leading-5 ${isConcluido ? "text-[#34C759]" : "text-white"}`}
                    >
                      {exercise.name}
                    </Text>
                    {exercise.description && (
                      <Text
                        className={`text-sm font-medium leading-5 mt-1 ${isConcluido ? "text-[#34C759]/80" : "text-muted"}`}
                        numberOfLines={2}
                      >
                        {exercise.description}
                      </Text>
                    )}
                  </View>

                  {isConcluido ? (
                    <CheckCircle2 color="#34C759" size={24} />
                  ) : (
                    <ChevronRight color={colors.muted} size={24} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <View className="flex-1 bg-level1">
        <Header
          variant={activeExercise ? "back" : "finish"}
          onPressBack={() =>
            activeExercise
              ? setActiveExercise(null)
              : router.replace("/students")
          }
          onPressFinish={() => setIsFinishOpen(true)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {activeExercise ? renderExecutionView() : renderListView()}
        </ScrollView>

        <FinishSessionModal
          visible={isFinishOpen}
          motivos={DEFAULT_FINISH_MOTIVOS}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={handleFinishSession}
        />

        {activeExercise && (
          <ActivityResultModal
            visible={isResultModalOpen}
            exerciseTitle={activeExercise.name}
            elapsedTime={elapsedTimeStr}
            onClose={() => setIsResultModalOpen(false)}
            onDefer={() => handleResult("adiado")}
            onNotCompleted={(motivo, desc) => handleResult("nao_realizada")}
            onConfirm={() => handleResult("concluido")}
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
            <CheckCircle2 size={20} color="#34C759" strokeWidth={3} />
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
      </View>
    </>
  );
}
