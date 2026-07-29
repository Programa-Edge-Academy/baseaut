import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { FormComponent } from "@/features/forms/components/form-component";
import { useKeyboardAwareScroll } from "@/lib/use-keyboard-aware-scroll";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import { supabase } from "@/lib/supabase";
import {
  ActivityResultModal,
  ActivityResultData,
  type ActivityNotCompletedData,
} from "@/features/exercises/components/activity-result-modal";
import { StartActivity } from "@/features/exercises/components/start-activity";
import { Stopwatch } from "@/features/exercises/components/stopwatch";
import { SessionExercise } from "@/features/sessions/screens/session-running-screen";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Split, XCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, Text, View } from "react-native";
import {
  useSessionFlow,
  type CrisisRecord,
  type ExecutionRecord,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";
import { formatSessionClock, useSessionGlobalContext } from "../contexts/session-global-context";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";

/** Whether the active exercise is awaiting start or actively running. */
type ExerciseStage = "ready" | "running";

/** Maps the result modal/finish reason labels to the `motivo_nao_realizacao_enum` values. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  // Kept so records saved before these two options were retired still map.
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

/** Maps the picked reason labels to their enum values, defaulting to "outro". */
function toMotivoEnums(motivos: string[]): MotivoNaoRealizacao[] {
  const mapped = motivos.map((m) => MOTIVO_NAO_REALIZACAO_MAP[m] ?? "outro");
  return mapped.length > 0 ? mapped : ["outro"];
}

/** Props for {@link SessionRunningSemiStructuredScreen}. */
export type SessionRunningSemiStructuredProps = {
  studentName: string;
  exercises: SessionExercise[];
  studentId?: string;
  sessionId?: string;
  circuitId?: string;
  circuitName?: string;
};

/**
 * Drives a semi-structured session where the user freely picks the next exercise
 * from a list (or launches an engagement activity). Each resolved exercise is
 * saved as its own execution, with crisis/flight timing and an inline Control
 * Record; finishing routes to the completion screen.
 *
 * @remarks
 * An exercise that already has a result can be picked again, no matter how it
 * ended, and each run is recorded as its own execution. The list only locks
 * while another exercise is actually running. The session still ends on its own
 * once every exercise has been resolved at least once, so repeats happen while
 * something is still pending.
 */
export function SessionRunningSemiStructuredScreen({
  studentName,
  exercises,
  studentId = "",
  sessionId = "",
  circuitId = "",
  circuitName = "",
}: SessionRunningSemiStructuredProps) {
  const router = useRouter();
  const { t } = useI18n();

  const { createSession, persistExecutions, saveSession, finalizeSessionAutoFill } = useSessionFlow();
  const { registerSession, updateSessionProgress, updateSessionState, toggleTimer, closeSession, activeSessions, updateTimeElapsed, setTimerVisible, setFormVisible, addFugaInterval } = useSessionGlobalContext();
  // Any session started while a tutorial simulation is active is mock/practice.
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active;

  const [effectiveSessionId, setEffectiveSessionId] = useState<string>(sessionId || "");
  const effectiveSessionIdRef = useRef<string>(sessionId || "");
  const createSessionPromiseRef = useRef<Promise<string> | null>(null);
  const [rcFormId, setRcFormId] = useState<string>("");
  const formRef = useRef<any>(null);
  const ordemRef = useRef(0);
  const lastElapsedSecondsRef = useRef<number | null>(null);

  const [isCriseActive, setIsCriseActive] = useState(false);
  const criseStartRef = useRef<number | null>(null);
  const [isFugaActive, setIsFugaActive] = useState(false);
  const fugaStartRef = useRef<number | null>(null);
  const crisesRef = useRef<CrisisRecord[]>([]);
  const fugaStartTotalRef = useRef<number | null>(null);
  const fugaIntervalsRef = useRef<{ start: number; end: number }[]>([]);

  const safeStudentName = studentName || t("common.student");

  const finalizeActiveCrise = () => {
    if (criseStartRef.current == null || !activeExercise) {
      criseStartRef.current = null;
      setIsCriseActive(false);
      return;
    }
    const durationSeconds = (Date.now() - criseStartRef.current) / 1000;
    crisesRef.current = [
      ...crisesRef.current,
      { exercicioId: activeExercise.id, durationSeconds, tipo: "crise" },
    ];
    criseStartRef.current = null;
    setIsCriseActive(false);
  };

  const handleCrisePress = () => {
    if (criseStartRef.current == null) {
      criseStartRef.current = Date.now();
      setIsCriseActive(true);
    } else {
      finalizeActiveCrise();
    }
  };

  const finalizeActiveFuga = () => {
    if (fugaStartRef.current == null || !activeExercise) {
      fugaStartRef.current = null;
      fugaStartTotalRef.current = null;
      setIsFugaActive(false);
      return;
    }
    const durationSeconds = (Date.now() - fugaStartRef.current) / 1000;
    crisesRef.current = [
      ...crisesRef.current,
      { exercicioId: activeExercise.id, durationSeconds, tipo: "fuga" },
    ];
    if (fugaStartTotalRef.current != null) {
      const interval = {
        start: fugaStartTotalRef.current,
        end: currentSessionData?.totalElapsed ?? 0,
      };
      fugaIntervalsRef.current = [...fugaIntervalsRef.current, interval];
      if (resolvedSid) addFugaInterval(resolvedSid, interval);
      fugaStartTotalRef.current = null;
    }
    fugaStartRef.current = null;
    setIsFugaActive(false);
  };

  const handleFugaPress = () => {
    if (fugaStartRef.current == null) {
      fugaStartRef.current = Date.now();
      fugaStartTotalRef.current = currentSessionData?.totalElapsed ?? 0;
      setIsFugaActive(true);
    } else {
      finalizeActiveFuga();
    }
  };

  const trySaveForm = () => {
    if (!formRef.current) return;
    void (formRef.current.handleSave(true, true) as Promise<any>);
  };

  useEffect(() => {
    if (!sessionId) return;
    const existing = activeSessions[sessionId];
    if (!existing) {
      registerSession({
        sessionId,
        studentId,
        studentName: safeStudentName,
        type: "semi-structured",
        timeElapsed: 0,
        isRunning: false,
        exerciseProgress: "Retomando...",
        exercisesJson: JSON.stringify(exercises.map((e) => ({ id: e.id, name: e.name, description: e.description, iconUrl: e.iconUrl ?? null }))),
        circuitId: circuitId || undefined,
        circuitName: circuitName || undefined,
        isTutorial,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const ensureSessionId = async (): Promise<string | null> => {
    if (effectiveSessionIdRef.current) return effectiveSessionIdRef.current;
    if (!createSessionPromiseRef.current) {
      const promise = (async () => {
        const id = await createSession({
          alunoId: studentId,
          circuitoId: circuitId || null,
        });
        effectiveSessionIdRef.current = id;
        setEffectiveSessionId(id);
        registerSession({
          sessionId: id,
          studentId,
          studentName: safeStudentName,
          type: "semi-structured",
          timeElapsed: 0,
          isRunning: false,
          exerciseProgress: t("session.exerciseProgress").replace("{n}", "1").replace("{total}", String(exercises.length)),
          exercisesJson: JSON.stringify(exercises.map((e) => ({ id: e.id, name: e.name, description: e.description, iconUrl: e.iconUrl ?? null }))),
          circuitId: circuitId || undefined,
          circuitName: circuitName || undefined,
          isTutorial,
        });
        return id;
      })();
      createSessionPromiseRef.current = promise.catch((err) => {
        createSessionPromiseRef.current = null;
        throw err;
      });
    }
    try {
      return await createSessionPromiseRef.current;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!effectiveSessionId) return;
    let active = true;
    supabase
      .from("sessoes")
      .select("formulario_id")
      .eq("id", effectiveSessionId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return;
        if (data?.formulario_id) {
          setRcFormId(data.formulario_id);
        } else {
          const { data: tmpl } = await supabase
            .from("formularios")
            .select("id")
            .eq("tipo", "registro_controle")
            .is("aluno_id", null)
            .maybeSingle();
          if (active && tmpl?.id) setRcFormId(tmpl.id);
        }
      });
    return () => { active = false; };
  }, [effectiveSessionId]);

  const persistResult = async (
    exercise: SessionExercise,
    record: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ) => {
    const resolvedSid = await ensureSessionId();
    if (!resolvedSid) return;
    ordemRef.current += 1;
    const fullRecord: ExecutionRecord = {
      exercicioId: exercise.id,
      ordemExecucao: ordemRef.current,
      ...record,
    };
    try {
      await persistExecutions(resolvedSid, [fullRecord]);
    } catch {}
  };

  const resolvedSid = sessionId || effectiveSessionIdRef.current || "";
  const currentSessionData = activeSessions[resolvedSid];
  const isFormVisible = currentSessionData?.isFormVisible ?? true;
  const rcKeyboardAware = useKeyboardAwareScroll();
  const rcKeyboardPadding = useKeyboardPadding();
  const [activeExercise, setActiveExercise] = useState<SessionExercise | null>(() => {
    if (!currentSessionData?.activeExerciseId) return null;
    return exercises.find((e) => e.id === currentSessionData.activeExerciseId) ?? null;
  });
  const [stage, setStage] = useState<ExerciseStage>(() => {
    if (currentSessionData?.activeExerciseId) return "running";
    return "ready";
  });

  const [historicoExercicios, setHistoricoExercicios] = useState<
    Record<string, "concluido" | "nao_realizada" | "adiado">
  >(() => currentSessionData?.historico ?? {});

  const controlledSeconds = currentSessionData?.timeElapsed ?? 0;
  const controlledIsRunning = currentSessionData?.isRunning ?? false;

  const [elapsedTimeStr, setElapsedTimeStr] = useState<string | undefined>();
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);

  useEffect(() => {
    if (!resolvedSid) return;
    setTimerVisible(resolvedSid, !!activeExercise);
  }, [activeExercise, resolvedSid, setTimerVisible]);

  useEffect(() => {
    if (!resolvedSid) return;
    updateSessionState(resolvedSid, { historico: historicoExercicios });
  }, [historicoExercicios, resolvedSid]);

  useEffect(() => {
    if (!resolvedSid) return;
    const completed = Object.keys(historicoExercicios).length;
    const current = Math.min(completed + 1, exercises.length);
    updateSessionProgress(resolvedSid, t("session.exerciseProgress").replace("{n}", String(current)).replace("{total}", String(exercises.length)));
  }, [historicoExercicios, exercises.length, resolvedSid, updateSessionProgress]);

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
    if (exercise.id === currentSessionData?.activeExerciseId) {
      setStage("running");
    } else {
      setStage("ready");
    }
  };

  const handleStop = () => {
    const elapsed = controlledSeconds;
    // A crisis/escape still being timed when the exercise is stopped is recorded
    // (with its elapsed duration) as if its own button had been pressed first.
    finalizeActiveCrise();
    finalizeActiveFuga();
    lastElapsedSecondsRef.current = elapsed;
    if (resolvedSid) toggleTimer(resolvedSid, false);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleResult = async (
    status: "concluido" | "nao_realizada" | "adiado",
    options?: {
      motivos?: string[];
      descricao?: string;
      result?: ActivityResultData;
      notCompleted?: ActivityNotCompletedData;
    },
  ) => {
    if (!activeExercise) return;

    const exercise = activeExercise;
    const duracao = lastElapsedSecondsRef.current;

    finalizeActiveCrise();
    finalizeActiveFuga();

    if (status === "concluido") {
      await persistResult(exercise, {
        statusRealizacao: "realizada",
        nivelDesenvolvimento: options?.result?.nivelDesenvolvimento ?? null,
        registroAjuda: options?.result?.registroAjuda ?? null,
        complementosAjuda: options?.result?.subCategorias ?? null,
        duracaoRealSegundos: duracao,
      });
    } else if (status === "nao_realizada") {
      // Whatever was observed during the attempt is recorded with the reasons.
      await persistResult(exercise, {
        statusRealizacao: "nao_realizada",
        motivoNaoRealizacao: toMotivoEnums(options?.motivos ?? []),
        descricaoAdicional: options?.descricao ?? null,
        nivelDesenvolvimento: options?.notCompleted?.nivelDesenvolvimento ?? null,
        registroAjuda: options?.notCompleted?.registroAjuda ?? null,
        complementosAjuda:
          options?.notCompleted?.subCategorias?.length
            ? options.notCompleted.subCategorias
            : null,
        duracaoRealSegundos: duracao,
      });
    } else {
      await persistResult(exercise, {
        statusRealizacao: "adiado",
        duracaoRealSegundos: duracao,
      });
    }

    lastElapsedSecondsRef.current = null;

    const novoHistorico = {
      ...historicoExercicios,
      [exercise.id]: status,
    };
    setHistoricoExercicios(novoHistorico);
    if (resolvedSid) {
      updateSessionState(resolvedSid, { activeExerciseId: null });
    }

    setIsResultModalOpen(false);
    triggerToast();

    const pendentes = exercises.filter((ex) => !novoHistorico[ex.id]);

    if (pendentes.length === 0) {
      trySaveForm();
      const finalSid = effectiveSessionIdRef.current;
      if (finalSid) {
        await saveSession(finalSid, [], crisesRef.current, { status: "concluida" });
        await finalizeSessionAutoFill(
          finalSid,
          currentSessionData?.totalElapsed ?? 0,
          fugaIntervalsRef.current,
        );
        closeSession(finalSid);
      }
      const naoRealizados = exercises.filter(
        (ex) => novoHistorico[ex.id] === "nao_realizada",
      );
      const attempted = Object.keys(novoHistorico).length;
      const realized = Object.values(novoHistorico).filter(
        (s) => s === "concluido",
      ).length;
      router.replace({
        pathname: "/session/completed",
        params: {
          type: "semi-structured",
          studentName: safeStudentName,
          studentId,
          sessionId: finalSid,
          fullCircuit: JSON.stringify(exercises),
          queue: JSON.stringify(naoRealizados),
          attempted: String(attempted),
          realized: String(realized),
        },
      });
    } else {
      setActiveExercise(null);
    }
  };

  /**
   * Finishes a semi-structured session early. Only confirmation is required (no
   * finish reason): exercises that were never attempted are left untouched, and
   * the completion screen's progress reflects only the attempted exercises.
   */
  const handleFinishSession = () => {
    setIsFinishOpen(false);

    finalizeActiveCrise();
    finalizeActiveFuga();
    trySaveForm();

    const naoRealizados = exercises.filter(
      (ex) => historicoExercicios[ex.id] === "nao_realizada",
    );
    const attempted = Object.keys(historicoExercicios).length;
    const realized = Object.values(historicoExercicios).filter(
      (s) => s === "concluido",
    ).length;

    const finalSid = effectiveSessionIdRef.current;
    if (finalSid) {
      const totalAtFinish = currentSessionData?.totalElapsed ?? 0;
      const fugasAtFinish = fugaIntervalsRef.current;
      void (async () => {
        await saveSession(finalSid, [], crisesRef.current, {
          status: "concluida",
        });
        await finalizeSessionAutoFill(finalSid, totalAtFinish, fugasAtFinish);
      })();
      closeSession(finalSid);
    }

    router.push({
      pathname: "/session/completed",
      params: {
        type: "semi-structured",
        studentName: safeStudentName,
        studentId,
        sessionId: finalSid,
        fullCircuit: JSON.stringify(exercises),
        queue: JSON.stringify(naoRealizados),
        attempted: String(attempted),
        realized: String(realized),
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
          <Text className="text-content text-base text-center font-medium">
            Não foi possível carregar os exercícios do circuito.
          </Text>
        </View>
      </View>
    );
  }

  const renderExecutionView = () => {
    if (!activeExercise || stage !== "ready") return null;

    return (
      <View className="mt-5 px-8">
        <PageHeader
          mode="execucao"
          title={t("sessions.circuitSelection.title").replace("{name}", safeStudentName)}
          subtitle={t("session.subtitleSemiExercise").replace("{clock}", formatSessionClock(currentSessionData?.totalElapsed ?? 0))}
          totalExercises={1}
          completedExercises={0}
          isExecuting={false}
        />
        <View className="mt-5">
          <StartActivity
            title={activeExercise.name}
            subtitle={activeExercise.description}
            iconUrl={activeExercise.iconUrl}
            onStart={async () => {
              setStage("running");
              const newSid = await ensureSessionId();
              if (newSid) {
                updateTimeElapsed(newSid, 0);
                toggleTimer(newSid, true);
                updateSessionState(newSid, { activeExerciseId: activeExercise.id });
              }
            }}
            onStartAndRecord={null}
          />
        </View>
      </View>
    );
  };

  const renderRunningHeader = () => {
    if (!activeExercise || stage !== "running") return null;

    return (
      <View className="mt-5 px-8">
        <PageHeader
          mode="execucao"
          title={t("sessions.circuitSelection.title").replace("{name}", safeStudentName)}
          subtitle={t("session.subtitleSemiExercise").replace("{clock}", formatSessionClock(currentSessionData?.totalElapsed ?? 0))}
          totalExercises={1}
          completedExercises={0}
          isExecuting={true}
        />
        <View className="mt-5">
          <Stopwatch
            title={activeExercise.name}
            subtitle={activeExercise.description}
            imageUrl={activeExercise.iconUrl ?? undefined}
            autoStart
            variant="form"
            onPressCrise={handleCrisePress}
            isCriseActive={isCriseActive}
            onPressFuga={handleFugaPress}
            isFugaActive={isFugaActive}
            onStop={handleStop}
            onRestart={() => {
              if (resolvedSid) updateTimeElapsed(resolvedSid, 0);
            }}
            controlledSeconds={controlledSeconds}
            controlledIsRunning={controlledIsRunning}
            onToggleRunning={(isRunning) => {
              if (resolvedSid) toggleTimer(resolvedSid, isRunning);
            }}
            isFormVisible={isFormVisible}
            onPressCorner={() => {
              if (resolvedSid) setFormVisible(resolvedSid, !isFormVisible);
            }}
          />
        </View>
      </View>
    );
  };

  const renderListView = () => {
    return (
      <View className="flex-1">
        <View className="mx-8 mt-5 mb-8">
          <PageHeader
            title={t("sessions.circuitSelection.title").replace("{name}", safeStudentName)}
            subtitle={t("session.subtitleSemiCircuit").replace("{clock}", formatSessionClock(currentSessionData?.totalElapsed ?? 0))}
          />
        </View>

        <View className="mx-5 rounded-2xl bg-level1 border border-primary p-5">
          <View className="flex-row items-center justify-between gap-4 pb-5 mb-5 border-b border-outline">
            <View className="flex-1 space-y-1">
              <Text className="text-content text-base font-medium leading-5">
                Selecione o próximo exercício
              </Text>
              <Text className="text-muted text-sm font-medium leading-5">
                Para atividades de engajamento, pressione o botão amarelo ao lado
              </Text>
            </View>

            <Pressable
              className="w-10 h-10 rounded-full bg-extra/10 border border-extra justify-center items-center flex-shrink-0 active:opacity-70"
              onPress={async () => {
                const sid = await ensureSessionId();
                router.push({
                  pathname: "/session/engagement",
                  params: {
                    studentName: safeStudentName,
                    studentId,
                    sessionId: sid ?? "",
                  },
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
              const isNaoRealizada = status === "nao_realizada";

              const hasActiveExercise = !!currentSessionData?.activeExerciseId;
              const isRunningThis = exercise.id === currentSessionData?.activeExerciseId;
              const isBlocked = hasActiveExercise && !isRunningThis;

              // An exercise that already has a result stays selectable: picking
              // it again runs it once more and records a separate execution,
              // whether it was completed, deferred or not performed. Only
              // another exercise being run right now blocks the list.
              const disabled = isBlocked;

              return (
                <Pressable
                  key={exercise.id}
                  disabled={disabled}
                  className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 ${
                    isBlocked
                      ? "bg-level2 border-outline opacity-40"
                      : isConcluido
                        ? "bg-[#34C759]/10 border-[#34C759] active:opacity-70"
                        : isNaoRealizada
                          ? "bg-error/10 border-error active:opacity-70"
                          : "bg-level2 border-outline active:opacity-70"
                  }`}
                  onPress={() => handleSelectExercise(exercise)}
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className={`text-base font-medium leading-5 ${
                        isConcluido
                          ? "text-[#34C759]"
                          : isNaoRealizada
                            ? "text-error"
                            : "text-content"
                      }`}
                    >
                      {exercise.name}
                    </Text>
                    {exercise.description && (
                      <Text
                        className={`text-sm font-medium leading-5 mt-1 ${
                          isConcluido
                            ? "text-[#34C759]/80"
                            : isNaoRealizada
                              ? "text-error/80"
                              : "text-muted"
                        }`}
                        numberOfLines={2}
                      >
                        {exercise.description}
                      </Text>
                    )}
                  </View>

                  {/* A resolved exercise keeps its result icon and also gets the
                      chevron, so it still reads as something that can be run
                      again. */}
                  <View className="flex-row items-center gap-1.5">
                    {isConcluido && <CheckCircle2 color="#34C759" size={24} />}
                    {isNaoRealizada && <XCircle color={colors.error} size={24} />}
                    {!isBlocked && <ChevronRight color={colors.muted} size={24} />}
                  </View>
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
          variant={activeExercise ? "back" : "finishEngagement"}
          onPressBack={() =>
            activeExercise
              ? setActiveExercise(null)
              : router.back()
          }
          onPressFinish={() => setIsFinishOpen(true)}
        />

        {renderRunningHeader()}
        {renderExecutionView()}

        <ScrollView
          {...rcKeyboardAware}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 + rcKeyboardPadding }}
        >
          {!activeExercise && renderListView()}

          {rcFormId && (
            <View
              className="mx-5 mt-4"
              style={{ display: isFormVisible ? "flex" : "none" }}
            >
              <FormComponent
                ref={formRef}
                formularioId={rcFormId}
                sessaoId={effectiveSessionId}
                alunoId={""}
                hideAutoFilledSessionFields
                scrollable={false}
              />
            </View>
          )}
        </ScrollView>

        <ConfirmationModal
          visible={isFinishOpen}
          mode="finishSession"
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
            onNotCompleted={(data) =>
              handleResult("nao_realizada", {
                motivos: data.motivos,
                descricao: data.descricao,
                notCompleted: data,
              })
            }
            onConfirm={(result) => handleResult("concluido", { result })}
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
