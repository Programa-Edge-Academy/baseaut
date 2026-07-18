import { colors } from "@/assets/colors";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { FormComponent } from "@/features/forms/components/form-component";
import { useKeyboardAwareScroll } from "@/lib/use-keyboard-aware-scroll";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { Check } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, ScrollView, Text, View } from "react-native";
import { ActivityResultModal } from "../../exercises/components/activity-result-modal";
import { MabcResultModal } from "../../exercises/components/mabc-result-modal";
import { StartActivity } from "../../exercises/components/start-activity";
import { Stopwatch } from "../../exercises/components/stopwatch";
import { CircuitType } from "../../circuits/hooks/use-circuits";
import {
  DEFAULT_FINISH_MOTIVOS,
  FinishSessionModal,
} from "../components/finish-session-modal";
import { ReorderModal } from "../components/reorder-modal";
import { useResumeSession } from "../hooks/use-resume-session";
import { formatSessionClock, useSessionGlobalContext } from "../contexts/session-global-context";
import {
  useSessionFlow,
  type CrisisRecord,
  type ExecutionRecord,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";

/** Maps the result-modal/finish reason labels to the motivo_nao_realizacao_enum. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

// Each stopwatch control the sessions tutorial spotlights twice (press, then
// press again) uses a stable key pair so the highlight persists across both
// presses. Module-level so the array identity is stable across renders.
const CRISE_SIM_KEYS = ["crise", "crise2"];
const FUGA_SIM_KEYS = ["fuga", "fuga2"];
const PAUSE_SIM_KEYS = ["pauseResume", "pauseResume2"];
const TOGGLE_FORM_SIM_KEYS = ["toggleForm", "toggleForm2"];
// The stop button spotlights three exercises: session 1 ex1 ("stop"), session 1
// ex2 ("stopSecond") and session 2 ex1 ("stopNotDone").
const STOP_SIM_KEYS = ["stop", "stopSecond", "stopNotDone"];

/** An exercise within a running session. */
export type SessionExercise = {
  id: string;
  name: string;
  description: string;
  mediaUrls?: string[];
  iconUrl?: string | null;
};

/** Whether the current exercise is awaiting start or actively running. */
type ExerciseStage = "ready" | "running";

/** Props for {@link SessionRunningScreen}. */
export type SessionRunningScreenProps = {
  sessionId: string;
  studentId: string;
  studentName: string;
  circuitId?: string;
  circuitName?: string;
  circuitType?: CircuitType;
  exercises?: SessionExercise[];
  onPressBack?: () => void;
  onFinishSession?: (motivo: string) => void;
  onCompleteSession?: (
    hasWarnings: boolean,
    pendentes: SessionExercise[],
    todos: SessionExercise[],
    sessionId: string,
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
  sessionId,
  studentId,
  studentName,
  circuitId,
  circuitName = "",
  circuitType = "padrao",
  exercises = [],
  onPressBack,
  onFinishSession,
  onCompleteSession,
}: SessionRunningScreenProps) {
  const { t } = useI18n();
  const formRef = useRef<any>(null);
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "session";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { createSession, persistExecutions, saveSession, finalizeSessionAutoFill } = useSessionFlow({ mock: isTutorial });

  const [effectiveSessionId, setEffectiveSessionId] = useState<string>(
    sessionId || "",
  );
  const effectiveSessionIdRef = useRef<string>(sessionId || "");
  const [rcFormId, setRcFormId] = useState<string>("");
  const createSessionPromiseRef = useRef<Promise<string> | null>(null);

  const { registerSession, updateSessionProgress, updateSessionState, toggleTimer, closeSession, activeSessions, updateTimeElapsed, setTimerVisible, setFormVisible, addFugaInterval } = useSessionGlobalContext();
  const executionsRef = useRef<ExecutionRecord[]>([]);
  const lastElapsedSecondsRef = useRef<number | null>(null);

  const [isCriseActive, setIsCriseActive] = useState(false);
  const criseStartRef = useRef<number | null>(null);
  const [isFugaActive, setIsFugaActive] = useState(false);
  const fugaStartRef = useRef<number | null>(null);
  const crisesRef = useRef<CrisisRecord[]>([]);
  const fugaStartTotalRef = useRef<number | null>(null);
  const fugaIntervalsRef = useRef<{ start: number; end: number }[]>([]);

  const finalizeActiveCrise = () => {
    if (criseStartRef.current == null) return;
    const durationSeconds = (Date.now() - criseStartRef.current) / 1000;
    crisesRef.current = [
      ...crisesRef.current,
      { exercicioId: currentExercise.id, durationSeconds, tipo: "crise" },
    ];
    criseStartRef.current = null;
    setIsCriseActive(false);
  };

  const handleCrisePress = () => {
    if (isTutorial && (sim.currentKey === "crise" || sim.currentKey === "crise2")) {
      sim.complete(sim.currentKey);
    }
    if (criseStartRef.current == null) {
      criseStartRef.current = Date.now();
      setIsCriseActive(true);
    } else {
      finalizeActiveCrise();
    }
  };

  const finalizeActiveFuga = () => {
    if (fugaStartRef.current == null) return;
    const durationSeconds = (Date.now() - fugaStartRef.current) / 1000;
    crisesRef.current = [
      ...crisesRef.current,
      { exercicioId: currentExercise.id, durationSeconds, tipo: "fuga" },
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
    if (isTutorial && (sim.currentKey === "fuga" || sim.currentKey === "fuga2")) {
      sim.complete(sim.currentKey);
    }
    if (fugaStartRef.current == null) {
      fugaStartRef.current = Date.now();
      fugaStartTotalRef.current = currentSessionData?.totalElapsed ?? 0;
      setIsFugaActive(true);
    } else {
      finalizeActiveFuga();
    }
  };

  const safeStudentName = studentName || t("common.student");

  useEffect(() => {
    if (!sessionId || exercises.length === 0) return;
    const existing = activeSessions[sessionId];
    if (!existing) {
      registerSession({
        sessionId,
        studentId,
        studentName: safeStudentName,
        type: "structured",
        timeElapsed: 0,
        isRunning: false,
        exerciseProgress: "Retomando...",
        exercisesJson: JSON.stringify(exercises.map((e) => ({ id: e.id, name: e.name, description: e.description, iconUrl: e.iconUrl ?? null }))),
        circuitId: circuitId || undefined,
        circuitName: circuitName || undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, exercises.length]);

  const ensureSessionId = async (): Promise<string | null> => {
    if (effectiveSessionIdRef.current) return effectiveSessionIdRef.current;
    if (!createSessionPromiseRef.current) {
      const promise = (async () => {
        const id = await createSession({
          alunoId: studentId,
          circuitoId: effectiveCircuitId || null,
        });
        effectiveSessionIdRef.current = id;
        setEffectiveSessionId(id);
        registerSession({
          sessionId: id,
          studentId,
          studentName: safeStudentName,
          type: "structured",
          timeElapsed: 0,
          isRunning: false,
          exerciseProgress: t("session.exerciseProgress").replace("{n}", "1").replace("{total}", String(exercises.length)),
          exercisesJson: JSON.stringify(exercises.map((e) => ({ id: e.id, name: e.name, description: e.description, iconUrl: e.iconUrl ?? null }))),
          circuitId: effectiveCircuitId || undefined,
          circuitName: effectiveCircuitName || undefined,
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
    if (isTutorial) {
      setRcFormId("mock-rc");
      return;
    }
    if (!effectiveSessionId) return;
    let active = true;
    supabase
      .from("sessoes")
      .select("formulario_id")
      .eq("id", effectiveSessionId)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.formulario_id) setRcFormId(data.formulario_id);
      });
    return () => {
      active = false;
    };
  }, [effectiveSessionId, isTutorial]);

  const { data: resumeData } = useResumeSession(sessionId || null);

  const resolvedSid = sessionId || effectiveSessionIdRef.current || "";
  const currentSessionData = activeSessions[resolvedSid];

  const [order, setOrder] = useState<SessionExercise[]>(() => {
    if (exercises && exercises.length > 0) return exercises;

    if (currentSessionData?.exercisesJson) {
      try {
        const parsed = JSON.parse(currentSessionData.exercisesJson) as SessionExercise[];
        return parsed.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          mediaUrls: [],
          iconUrl: e.iconUrl ?? null,
        }));
      } catch {}
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (currentSessionData?.activeExerciseId) {
      const idx = order.findIndex((e) => e.id === currentSessionData.activeExerciseId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [stage, setStage] = useState<ExerciseStage>(() => {
    if (currentSessionData?.activeExerciseId) return "running";
    return "ready";
  });

  useEffect(() => {
    if (order.length === 0 && exercises.length > 0) {
      setOrder(exercises);
    }
  }, [exercises, order.length]);

  const controlledSeconds = currentSessionData?.timeElapsed ?? 0;
  const controlledIsRunning = currentSessionData?.isRunning ?? false;

  const effectiveCircuitId = circuitId || currentSessionData?.circuitId || "";
  const effectiveCircuitName = circuitName || currentSessionData?.circuitName || t("session.defaultCircuit");

  useEffect(() => {
    if (!resolvedSid) return;
    setTimerVisible(resolvedSid, true);
    return () => setTimerVisible(resolvedSid, false);
  }, [resolvedSid, setTimerVisible]);
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string | undefined>();
  const [deferredExercises, setDeferredExercises] = useState<string[]>([]);
  const [historicoExercicios, setHistoricoExercicios] = useState<
    Record<string, "concluido" | "nao_realizada" | "adiado">
  >({});
  useEffect(() => {
    if (!resumeData || resumeData.executions.length === 0) return;

    const executed = new Set(resumeData.executions.map((e) => e.exercicioId));

    executionsRef.current = resumeData.executions;

    const histrico: Record<string, "concluido" | "nao_realizada" | "adiado"> =
      {};
    for (const exec of resumeData.executions) {
      histrico[exec.exercicioId] =
        exec.statusRealizacao === "realizada"
          ? "concluido"
          : exec.statusRealizacao === "adiado"
            ? "adiado"
            : "nao_realizada";
    }
    setHistoricoExercicios(histrico);
    setHasAdvanced(true);

    if (!currentSessionData?.activeExerciseId) {
      const resumeIndex = order.findIndex((ex) => !executed.has(ex.id));
      setCurrentIndex(resumeIndex === -1 ? Math.max(0, order.length - 1) : resumeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData]);

  const isMabc =
    circuitType === "mabc_1" ||
    circuitType === "mabc_2" ||
    circuitType === "mabc_3";

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  const isFormVisible = currentSessionData?.isFormVisible ?? true;
  const rcKeyboardAware = useKeyboardAwareScroll();
  const rcKeyboardPadding = useKeyboardPadding();

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
    advanceSession("adiado", {
      statusRealizacao: "adiado",
      duracaoRealSegundos: lastElapsedSecondsRef.current,
    });
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
    advanceSession("adiado", {
      statusRealizacao: "adiado",
      duracaoRealSegundos: lastElapsedSecondsRef.current,
    });
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

  const persistAndFinish = async (
    motivoFinalizacao: MotivoNaoRealizacao | null = null,
    descricaoMotivo: string | null = null,
  ) => {
    let sid = effectiveSessionIdRef.current;
    if (!sid) {
      if (!createSessionPromiseRef.current) return;
      try {
        sid = await createSessionPromiseRef.current;
      } catch {
        return;
      }
    }

    const executedIds = new Set(
      executionsRef.current.map((e) => e.exercicioId),
    );
    const unexecuted = order.filter((ex) => !executedIds.has(ex.id));
    if (unexecuted.length > 0) {
      const baseOrdem = executionsRef.current.length;
      const records: ExecutionRecord[] = unexecuted.map((ex, i) => ({
        exercicioId: ex.id,
        ordemExecucao: baseOrdem + i + 1,
        statusRealizacao: "nao_realizada",
        motivoNaoRealizacao: motivoFinalizacao ?? "outro",
        descricaoAdicional: descricaoMotivo,
      }));
      executionsRef.current = [...executionsRef.current, ...records];
      try {
        await persistExecutions(sid, records);
      } catch {}
    }

    try {
      await saveSession(sid, executionsRef.current, crisesRef.current, {
        status: "concluida",
        motivoFinalizacao,
        descricaoMotivo,
      });
      await finalizeSessionAutoFill(
        sid,
        currentSessionData?.totalElapsed ?? 0,
        fugaIntervalsRef.current,
      );
      closeSession(sid);
    } catch {}
  };

  const trySaveForm = () => {
    if (!formRef.current) return;
    void (formRef.current.handleSave(true, true) as Promise<any>);
  };

  const advanceSession = (
    statusAtual: "concluido" | "nao_realizada" | "adiado",
    record?: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ) => {
    finalizeActiveCrise();
    finalizeActiveFuga();

    setStage("ready");
    setHasAdvanced(true);

    const historicoAtualizado = {
      ...historicoExercicios,
      [currentExercise.id]: statusAtual,
    };

    setHistoricoExercicios(historicoAtualizado);

    if (record) {
      const newRecord: ExecutionRecord = {
        exercicioId: currentExercise.id,
        ordemExecucao: currentIndex + 1,
        ...record,
      };
      executionsRef.current = [...executionsRef.current, newRecord];

      const sid = effectiveSessionIdRef.current;
      if (sid) void persistExecutions(sid, [newRecord]);
    }
    lastElapsedSecondsRef.current = null;

    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      if (effectiveSessionIdRef.current) {
        updateSessionState(effectiveSessionIdRef.current, { activeExerciseId: null });
        updateSessionProgress(effectiveSessionIdRef.current, t("session.exerciseProgress").replace("{n}", String(currentIndex + 2)).replace("{total}", String(total)));
      }
    } else {
      const pendentes = order.filter(
        (ex) =>
          historicoAtualizado[ex.id] !== "concluido" &&
          historicoAtualizado[ex.id] !== "adiado",
      );
      const temPendencias = pendentes.length > 0;

      trySaveForm();
      void persistAndFinish();
      onCompleteSession?.(
        temPendencias,
        pendentes,
        order,
        effectiveSessionIdRef.current,
      );
    }
  };

  const total = order.length;

  if (total === 0) {
    return (
      <View className="flex-1 bg-level1">
        <Header variant="back" onPressBack={onPressBack} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-content text-base text-center font-medium">
            Não foi possível carregar os exercícios do circuito.
          </Text>
        </View>
      </View>
    );
  }

  const currentExercise = order[currentIndex];
  const subtitle = `${effectiveCircuitName} - ${currentIndex + 1}/${total} - ${formatSessionClock(currentSessionData?.totalElapsed ?? 0)}`;

  const isRealized = (id: string) =>
    historicoExercicios[id] === "concluido" ||
    historicoExercicios[id] === "nao_realizada";
  const reorderableExercises = order.filter((ex) => !isRealized(ex.id));
  const handleReorderPending = (reordered: SessionExercise[]) => {
    let i = 0;
    setOrder(order.map((ex) => (isRealized(ex.id) ? ex : reordered[i++])));
  };

  const handleBack = () => {
    if (isTutorial) sim.complete("goBack");
    onPressBack?.();
  };

  /**
   * Advances the start gate of whichever session the simulation is on: the first
   * one ("startExercise") or the second, which must be started for real before
   * it can be left in progress ("startAgain").
   */
  const completeStartSubStep = () => {
    if (!isTutorial) return;
    sim.complete(sim.currentKey === "startAgain" ? "startAgain" : "startExercise");
  };

  const handleStart = async () => {
    completeStartSubStep();
    setStage("running");
    const sid = await ensureSessionId();
    if (sid) {
      updateTimeElapsed(sid, 0);
      toggleTimer(sid, true);
      updateSessionState(sid, { activeExerciseId: currentExercise.id });
    }
  };

  const handleStartAndRecord = async () => {
    completeStartSubStep();
    setStage("running");
    const sid = await ensureSessionId();
    if (sid) {
      updateTimeElapsed(sid, 0);
      toggleTimer(sid, true);
      updateSessionState(sid, { activeExerciseId: currentExercise.id });
    }
  };

  const handleStop = (elapsed: number) => {
    if (isTutorial && STOP_SIM_KEYS.includes(sim.currentKey ?? "")) {
      sim.complete(sim.currentKey!);
    }
    // A crisis/escape still being timed when the exercise is stopped is recorded
    // (with its elapsed duration) as if its own button had been pressed first.
    finalizeActiveCrise();
    finalizeActiveFuga();
    lastElapsedSecondsRef.current = elapsed;
    if (resolvedSid) toggleTimer(resolvedSid, false);

    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");

    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleConfirmFinish = (motivo: string, descricao?: string) => {
    finalizeActiveCrise();
    finalizeActiveFuga();

    if (isTutorial) sim.complete("finishReason");

    if (formRef.current) {
      formRef.current.handleSave(true, true);
    }

    const pendentes = order.filter(
      (ex) =>
        historicoExercicios[ex.id] !== "concluido" &&
        historicoExercicios[ex.id] !== "adiado",
    );
    const temPendencias = pendentes.length > 0;

    void persistAndFinish(
      MOTIVO_NAO_REALIZACAO_MAP[motivo] ?? "outro",
      descricao ?? motivo,
    );
    onFinishSession?.(motivo);
    onCompleteSession?.(
      temPendencias,
      pendentes,
      order,
      effectiveSessionIdRef.current,
    );
    setIsFinishOpen(false);
  };

  return (
    <>
      <View className="flex-1 bg-level1">
        <Header
          variant={hasAdvanced ? "finish" : "back"}
          onPressBack={handleBack}
          onPressFinish={() => {
            if (isTutorial) sim.complete("finish");
            setIsFinishOpen(true);
          }}
          onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
          backSpotlightKey={isTutorial ? "goBack" : undefined}
          finishSpotlightKey={isTutorial ? "finish" : undefined}
        />

        <View className="flex-1">
          <View className="mx-8 mt-5">
            <PageHeader
              mode="execucao"
              title={t("sessions.circuitSelection.title").replace("{name}", studentName ?? "")}
              subtitle={subtitle}
              totalExercises={total}
              completedExercises={currentIndex}
              isExecuting={stage === "running"}
            />
          </View>

          <View className="mt-5 px-8">
            {stage === "ready" ? (
              <StartActivity
                title={currentExercise.name}
                subtitle={currentExercise.description}
                iconUrl={currentExercise.iconUrl}
                onStart={handleStart}
                onStartAndRecord={handleStartAndRecord}
                onPressInfo={() => {
                  if (isTutorial) sim.complete("openReorder");
                  setIsReorderOpen(true);
                }}
                infoSpotlightKeys={isTutorial ? "openReorder" : undefined}
                startSpotlightKeys={
                  isTutorial ? ["startExercise", "startAgain"] : undefined
                }
              />
            ) : (
              <Stopwatch
                title={currentExercise.name}
                subtitle={currentExercise.description}
                imageUrl={currentExercise.iconUrl ?? undefined}
                autoStart
                variant="form"
                onPressCrise={handleCrisePress}
                isCriseActive={isCriseActive}
                onPressFuga={handleFugaPress}
                isFugaActive={isFugaActive}
                onStop={handleStop}
                onRestart={() => {
                  if (isTutorial) sim.complete("restart");
                  if (resolvedSid) updateTimeElapsed(resolvedSid, 0);
                }}
                controlledSeconds={controlledSeconds}
                controlledIsRunning={controlledIsRunning}
                onToggleRunning={(isRunning) => {
                  if (isTutorial && (sim.currentKey === "pauseResume" || sim.currentKey === "pauseResume2")) {
                    sim.complete(sim.currentKey);
                  }
                  if (resolvedSid) toggleTimer(resolvedSid, isRunning);
                }}
                isFormVisible={isFormVisible}
                onPressCorner={() => {
                  if (isTutorial && (sim.currentKey === "toggleForm" || sim.currentKey === "toggleForm2")) {
                    sim.complete(sim.currentKey);
                  }
                  if (resolvedSid) setFormVisible(resolvedSid, !isFormVisible);
                }}
                criseSpotlightKey={isTutorial ? CRISE_SIM_KEYS : undefined}
                fugaSpotlightKey={isTutorial ? FUGA_SIM_KEYS : undefined}
                timerSpotlightKey={isTutorial ? PAUSE_SIM_KEYS : undefined}
                cornerSpotlightKey={isTutorial ? TOGGLE_FORM_SIM_KEYS : undefined}
                restartSpotlightKey={isTutorial ? "restart" : undefined}
                stopSpotlightKey={isTutorial ? STOP_SIM_KEYS : undefined}
              />
            )}
          </View>

          <ScrollView
            {...rcKeyboardAware}
            className="mt-5 px-8"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 + rcKeyboardPadding }}
          >
            {!isMabc && rcFormId && (
              <View style={{ display: isFormVisible ? "flex" : "none" }}>
                <FormComponent
                  ref={formRef}
                  formularioId={rcFormId}
                  sessaoId={effectiveSessionId}
                  alunoId={""}
                  hideAutoFilledSessionFields
                  scrollable={false}
                  mock={isTutorial}
                />
              </View>
            )}
          </ScrollView>
        </View>

        <ReorderModal
          visible={isReorderOpen}
          items={reorderableExercises}
          currentIndex={0}
          onClose={() => setIsReorderOpen(false)}
          onReorder={(reordered) => {
            if (isTutorial) sim.complete("reorder");
            handleReorderPending(reordered);
          }}
          reorderSpotlightKey={isTutorial ? "reorder" : undefined}
          confirmSpotlightKey={isTutorial ? "confirmReorder" : undefined}
        />

        <FinishSessionModal
          visible={isFinishOpen}
          motivos={DEFAULT_FINISH_MOTIVOS}
          reasonSpotlightKey={isTutorial ? "finishReason" : undefined}
          pendingExercises={order
            .filter(
              (ex) =>
                historicoExercicios[ex.id] !== "concluido" &&
                historicoExercicios[ex.id] !== "adiado",
            )
            .map((ex) => ex.name)}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={handleConfirmFinish}
        />

        {isMabc ? (
          <MabcResultModal
            visible={isResultModalOpen}
            exerciseName={currentExercise.name}
            circuitType={circuitType as "mabc_1" | "mabc_2" | "mabc_3"}
            onClose={() => setIsResultModalOpen(false)}
            onDefer={handleMabcDefer}
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
                nivelDesenvolvimento: result?.nivelDesenvolvimento ?? null,
                registroAjuda: result?.registroAjuda ?? null,
                complementosAjuda: result?.subCategorias ?? null,
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
              backgroundColor: colors.level2,
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

        {isTutorial && (
          <TutorialPracticeNotice
            visible={noticeOpen}
            onClose={() => setNoticeOpen(false)}
            onExit={() => setNoticeOpen(false)}
          />
        )}

        {isTutorial && <TutorialSpotlight />}
      </View>
    </>
  );
}
