import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { FormComponent } from "@/features/forms/components/form-component";
import { supabase } from "@/lib/supabase";
import {
  ActivityResultModal,
  ActivityResultData,
} from "@/features/exercises/components/activity-result-modal";
import { StartActivity } from "@/features/exercises/components/start-activity";
import { Stopwatch } from "@/features/exercises/components/stopwatch";
import {
  DEFAULT_FINISH_MOTIVOS,
  FinishSessionModal,
} from "@/features/sessions/components/finish-session-modal";
import { SessionExercise } from "@/features/sessions/screens/session-running-screen";
import { useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Split } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, Text, View } from "react-native";
import {
  useSessionFlow,
  type CrisisRecord,
  type ExecutionRecord,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";
import { formatSessionClock, useSessionGlobalContext } from "../contexts/session-global-context";

type ExerciseStage = "ready" | "running";

/** Mapeia os rótulos do modal/finalização para o motivo_nao_realizacao_enum. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

export type SessionRunningSemiStructuredProps = {
  studentName: string;
  exercises: SessionExercise[];
  studentId?: string;
  sessionId?: string;
  circuitId?: string;
  circuitName?: string;
};

export function SessionRunningSemiStructuredScreen({
  studentName,
  exercises,
  studentId = "",
  sessionId = "",
  circuitId = "",
  circuitName = "Circuito",
}: SessionRunningSemiStructuredProps) {
  const router = useRouter();

  const { createSession, persistExecutions, saveSession, finalizeSessionAutoFill } = useSessionFlow();
  const { registerSession, updateSessionProgress, updateSessionState, toggleTimer, closeSession, activeSessions, updateTimeElapsed, setTimerVisible, setFormVisible, addFugaInterval } = useSessionGlobalContext();

  // ID efetivo da sessão: usa o recebido (retomada) ou cria um na montagem.
  const [effectiveSessionId, setEffectiveSessionId] = useState<string>(sessionId || "");
  const effectiveSessionIdRef = useRef<string>(sessionId || "");
  const createSessionPromiseRef = useRef<Promise<string> | null>(null);
  // Template/instância de RC para o formulário inline.
  const [rcFormId, setRcFormId] = useState<string>("");
  const formRef = useRef<any>(null);
  // Contador de ordem de execução para gravar cada exercício realizado.
  const ordemRef = useRef(0);
  // Segundos do cronômetro capturados na última parada.
  const lastElapsedSecondsRef = useRef<number | null>(null);

  // Botões de crise/fuga: episódios cronometrados de forma oculta, por exercício.
  const [isCriseActive, setIsCriseActive] = useState(false);
  const criseStartRef = useRef<number | null>(null);
  const [isFugaActive, setIsFugaActive] = useState(false);
  const fugaStartRef = useRef<number | null>(null);
  const crisesRef = useRef<CrisisRecord[]>([]);
  // Início/fim de cada fuga no cronômetro total da sessão (para a resposta do RC).
  const fugaStartTotalRef = useRef<number | null>(null);
  const fugaIntervalsRef = useRef<{ start: number; end: number }[]>([]);

  const safeStudentName = studentName || "Aluno";

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
    // Registra o intervalo no cronômetro total (início → fim) para o RC.
    if (fugaStartTotalRef.current != null) {
      const interval = {
        start: fugaStartTotalRef.current,
        end: currentSessionData?.totalElapsed ?? 0,
      };
      fugaIntervalsRef.current = [...fugaIntervalsRef.current, interval];
      // Também persiste no contexto global (para finalização pelo widget).
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
    void (formRef.current.handleSave(true, true) as Promise<any>).then((result: any) => {
    });
  };

  // Para retomada via widget: o sessionId já existe, apenas garante o registro no contexto
  useEffect(() => {
    if (!sessionId) return;
    const existing = activeSessions[sessionId];
    // Só registra novamente se não existe no contexto (ex: app reiniciado)
    if (!existing) {
      registerSession({
        sessionId,
        studentId,
        studentName: safeStudentName,
        type: "semi-structured",
        timeElapsed: 0,
        isRunning: false,
        exerciseProgress: "Retomando...",
        exercisesJson: JSON.stringify(exercises.map((e) => ({ id: e.id, name: e.name, description: e.description }))),
        circuitId: circuitId || undefined,
        circuitName: circuitName || undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Cria a sessão no banco e registra no contexto de forma lazy (apenas no primeiro "Começar").
  // Retorna o sessionId criado ou o já existente.
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
          exerciseProgress: `Exercício 1/${exercises.length}`,
          exercisesJson: JSON.stringify(exercises.map((e) => ({ id: e.id, name: e.name, description: e.description }))),
          circuitId: circuitId || undefined,
          circuitName: circuitName || undefined,
        });
        return id;
      })();
      createSessionPromiseRef.current = promise.catch((err) => {
        createSessionPromiseRef.current = null; // allow retry on failure
        console.error("Erro ao criar sessão (semi-estruturado):", err);
        throw err;
      });
    }
    try {
      return await createSessionPromiseRef.current;
    } catch {
      return null;
    }
  };

  // Resolve a instância de RC da sessão para o formulário inline.
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

  // Persiste um exercício realizado/não realizado/adiado na sessão atual.
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
    } catch (err) {
      console.error("Erro ao salvar execução (semi-estruturado):", err);
    }
  };

  // Inicializa o histórico e o exercício ativo restaurando do contexto global (retomada)
  // O sid síncrono pode estar vazio para novas sessões (antes do primeiro "Começar").
  // Usamos o ref como fallback após criação assíncrona.
  const resolvedSid = sessionId || effectiveSessionIdRef.current || "";
  const currentSessionData = activeSessions[resolvedSid];
  // Visibilidade do RC por sessão (default visível; toggle persiste na sessão).
  const isFormVisible = currentSessionData?.isFormVisible ?? true;
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

  // Sincroniza a visibilidade do widget: oculta se a tela estiver exibindo a execução do exercício
  useEffect(() => {
    if (!resolvedSid) return;
    setTimerVisible(resolvedSid, !!activeExercise);
  }, [activeExercise, resolvedSid, setTimerVisible]);

  // Sincroniza o histórico de volta ao contexto global ao mudar
  useEffect(() => {
    if (!resolvedSid) return;
    updateSessionState(resolvedSid, { historico: historicoExercicios });
  }, [historicoExercicios, resolvedSid]);

  // Atualiza o progresso globalmente quando o histórico muda
  useEffect(() => {
    if (!resolvedSid) return;
    const completed = Object.keys(historicoExercicios).length;
    const current = Math.min(completed + 1, exercises.length);
    updateSessionProgress(resolvedSid, `Exercício ${current}/${exercises.length}`);
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
    lastElapsedSecondsRef.current = elapsed;
    if (resolvedSid) toggleTimer(resolvedSid, false);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleResult = async (
    status: "concluido" | "nao_realizada" | "adiado",
    options?: { motivo?: string; descricao?: string; result?: ActivityResultData },
  ) => {
    if (!activeExercise) return;

    const exercise = activeExercise;
    const duracao = lastElapsedSecondsRef.current;

    // Atribui crise/fuga em andamento a este exercício antes de avançar.
    finalizeActiveCrise();
    finalizeActiveFuga();

    // Cada exercício resolvido vira uma execução gravada na mesma sessão.
    // Aguardamos a gravação para que as crises/fugas possam ser vinculadas
    // à execução correspondente ao finalizar a sessão.
    if (status === "concluido") {
      // Dados clínicos coletados no modal (nível, ajuda e complementos).
      await persistResult(exercise, {
        statusRealizacao: "realizada",
        nivelDesenvolvimento: options?.result?.nivelDesenvolvimento ?? null,
        registroAjuda: options?.result?.registroAjuda ?? null,
        complementosAjuda: options?.result?.subCategorias ?? null,
        duracaoRealSegundos: duracao,
      });
    } else if (status === "nao_realizada") {
      await persistResult(exercise, {
        statusRealizacao: "nao_realizada",
        motivoNaoRealizacao:
          MOTIVO_NAO_REALIZACAO_MAP[options?.motivo ?? ""] ?? "outro",
        descricaoAdicional: options?.descricao ?? null,
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
      router.replace({
        pathname: "/session/completed",
        params: {
          type: "semi-structured",
          studentName: safeStudentName,
          studentId,
          sessionId: finalSid,
          fullCircuit: JSON.stringify(exercises),
          queue: JSON.stringify([]),
        },
      });
    } else {
      setActiveExercise(null);
    }
  };

  // Exercícios ainda não realizados (para exibir no modal de finalização).
  const pendentesNomes = exercises
    .filter((ex) => {
      const status = historicoExercicios[ex.id];
      return status !== "concluido" && status !== "adiado";
    })
    .map((ex) => ex.name);

  const handleFinishSession = (motivo: string, descricao?: string) => {
    setIsFinishOpen(false);

    // Encerra crise/fuga eventualmente ativas e salva o RC antes de finalizar.
    finalizeActiveCrise();
    finalizeActiveFuga();
    trySaveForm();

    const filaDePendentes = exercises.filter((ex) => {
      const status = historicoExercicios[ex.id];
      return status !== "concluido" && status !== "adiado";
    });

    const finalSid = effectiveSessionIdRef.current;
    if (finalSid) {
      const totalAtFinish = currentSessionData?.totalElapsed ?? 0;
      const fugasAtFinish = fugaIntervalsRef.current;
      void (async () => {
        await saveSession(finalSid, [], crisesRef.current, {
          status: "concluida",
          motivoFinalizacao: MOTIVO_NAO_REALIZACAO_MAP[motivo] ?? "outro",
          descricaoMotivo: descricao ?? motivo,
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

  // Estágio "ready": cabeçalho + StartActivity, fixos no topo (não rolam).
  const renderExecutionView = () => {
    if (!activeExercise || stage !== "ready") return null;

    return (
      <View className="mt-5 px-8">
        <PageHeader
          mode="execucao"
          title={`Sessão de ${safeStudentName}`}
          subtitle={`Exercício Semi-estruturado - ${formatSessionClock(currentSessionData?.totalElapsed ?? 0)}`}
          totalExercises={1}
          completedExercises={0}
          isExecuting={false}
        />
        <View className="mt-5">
          <StartActivity
            title={activeExercise.name}
            subtitle={activeExercise.description}
            mediaUrls={activeExercise.mediaUrls ?? []}
            onStart={async () => {
              setStage("running");
              // Cria a sessão no banco de forma lazy (somente no primeiro "Começar")
              const newSid = await ensureSessionId();
              if (newSid) {
                // Cada exercício tem seu próprio cronômetro — resetar antes de iniciar
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

  // Estágio "running": cabeçalho + cronômetro fixos no topo (não rolam com o RC).
  const renderRunningHeader = () => {
    if (!activeExercise || stage !== "running") return null;

    return (
      <View className="mt-5 px-8">
        <PageHeader
          mode="execucao"
          title={`Sessão de ${safeStudentName}`}
          subtitle={`Exercício Semi-estruturado - ${formatSessionClock(currentSessionData?.totalElapsed ?? 0)}`}
          totalExercises={1}
          completedExercises={0}
          isExecuting={true}
        />
        <View className="mt-5">
          <Stopwatch
            title={activeExercise.name}
            subtitle={activeExercise.description}
            imageUrl={activeExercise.mediaUrls?.[0]}
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
            title={`Sessão de ${safeStudentName}`}
            subtitle={`Circuito Semi-estruturado - ${formatSessionClock(currentSessionData?.totalElapsed ?? 0)}`}
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

              // Bloqueia outros exercícios se um já estiver rodando
              const hasActiveExercise = !!currentSessionData?.activeExerciseId;
              const isRunningThis = exercise.id === currentSessionData?.activeExerciseId;
              const isBlocked = hasActiveExercise && !isRunningThis;

              const disabled = isConcluido || isBlocked;

              return (
                <Pressable
                  key={exercise.id}
                  disabled={disabled}
                  className={`flex-row items-center justify-between rounded-2xl border px-5 py-4 ${
                    isConcluido
                      ? "bg-[#34C759]/10 border-[#34C759] opacity-70"
                      : isBlocked
                        ? "bg-level2 border-outline opacity-40"
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
          variant={activeExercise ? "back" : "finishEngagement"}
          onPressBack={() =>
            activeExercise
              ? setActiveExercise(null)
              : router.back()
          }
          onPressFinish={() => setIsFinishOpen(true)}
        />

        {/* Atividade fixa no topo (pronta ou em execução) — só o RC rola. */}
        {renderRunningHeader()}
        {renderExecutionView()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {!activeExercise && renderListView()}

          {/*
            Registro de Controle único da sessão: fica sempre montado para
            preservar as respostas ao alternar entre a lista e a execução,
            e é ocultável pelo botão de formulário do stopwatch (isFormVisible).
          */}
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
              />
            </View>
          )}
        </ScrollView>

        <FinishSessionModal
          visible={isFinishOpen}
          motivos={DEFAULT_FINISH_MOTIVOS}
          pendingExercises={pendentesNomes}
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
            onNotCompleted={(motivo, desc) =>
              handleResult("nao_realizada", { motivo, descricao: desc })
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
