import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
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
import { FormComponent } from "@/features/forms/components/form-component";
import { SessionExercise } from "@/features/sessions/screens/session-running-screen";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Split } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import {
  useSessionFlow,
  type ExecutionRecord,
  type MotivoFinalizacao,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";

type ExerciseStage = "ready" | "running";

/** Mapeia os rótulos do modal de resultado para o motivo_nao_realizacao_enum. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

/** Mapeia os rótulos de finalização antecipada para o motivo_finalizacao_enum. */
const MOTIVO_FINALIZACAO_MAP: Record<string, MotivoFinalizacao> = {
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Tempo insuficiente": "tempo_esgotado",
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

  const { createSession, persistExecutions, finishSession } = useSessionFlow();

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

  const safeStudentName = studentName || "Aluno";

  // Cria a sessão no banco quando ainda não há um id válido (início semi-estruturado).
  useEffect(() => {
    if (sessionId || !studentId || exercises.length === 0) return;
    if (createSessionPromiseRef.current) return;
    const promise = (async () => {
      const id = await createSession({
        alunoId: studentId,
        circuitoId: circuitId || null,
      });
      effectiveSessionIdRef.current = id;
      setEffectiveSessionId(id);
      return id;
    })();
    createSessionPromiseRef.current = promise.catch((err) => {
      console.error("Erro ao criar sessão (semi-estruturado):", err);
      throw err;
    });
  }, [sessionId, studentId, circuitId, exercises.length, createSession]);

  // Resolve a instância de RC da sessão. Circuitos sem formulario_id caem no
  // template global de RC como fallback (mesmo comportamento do circuito estruturado).
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
    return () => {
      active = false;
    };
  }, [effectiveSessionId]);

  // Garante um sessao_id válido antes de gravar (aguarda a criação em-flight).
  const ensureSessionId = async (): Promise<string | null> => {
    if (effectiveSessionIdRef.current) return effectiveSessionIdRef.current;
    if (!createSessionPromiseRef.current) return null;
    try {
      return await createSessionPromiseRef.current;
    } catch {
      return null;
    }
  };

  // Persiste um exercício realizado/não realizado/adiado na sessão atual.
  const persistResult = async (
    exercise: SessionExercise,
    record: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ) => {
    const sid = await ensureSessionId();
    if (!sid) return;
    ordemRef.current += 1;
    const fullRecord: ExecutionRecord = {
      exercicioId: exercise.id,
      ordemExecucao: ordemRef.current,
      ...record,
    };
    try {
      await persistExecutions(sid, [fullRecord]);
    } catch (err) {
      console.error("Erro ao salvar execução (semi-estruturado):", err);
    }
  };

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
    lastElapsedSecondsRef.current = elapsed;
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setElapsedTimeStr(`${minutes}:${seconds}`);
    setIsResultModalOpen(true);
  };

  const handleResult = (
    status: "concluido" | "nao_realizada" | "adiado",
    options?: { motivo?: string; descricao?: string; result?: ActivityResultData },
  ) => {
    if (!activeExercise) return;

    const exercise = activeExercise;
    const duracao = lastElapsedSecondsRef.current;

    // Cada exercício resolvido vira uma execução gravada na mesma sessão.
    if (status === "concluido") {
      // Dados clínicos coletados no modal (nível, ajuda e complementos).
      void persistResult(exercise, {
        statusRealizacao: "realizada",
        nivelDesenvolvimento: options?.result?.nivelDesenvolvimento ?? null,
        registroAjuda: options?.result?.registroAjuda ?? null,
        complementosAjuda: options?.result?.subCategorias ?? null,
        duracaoRealSegundos: duracao,
      });
    } else if (status === "nao_realizada") {
      void persistResult(exercise, {
        statusRealizacao: "nao_realizada",
        motivoNaoRealizacao:
          MOTIVO_NAO_REALIZACAO_MAP[options?.motivo ?? ""] ?? "outro",
        descricaoAdicional: options?.descricao ?? null,
        duracaoRealSegundos: duracao,
      });
    } else {
      void persistResult(exercise, {
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

    setIsResultModalOpen(false);
    triggerToast();

    const pendentes = exercises.filter((ex) => !novoHistorico[ex.id]);

    if (pendentes.length === 0) {
      const sid = effectiveSessionIdRef.current;
      if (sid) void finishSession(sid, { status: "concluida" });
      router.replace({
        pathname: "/session/completed",
        params: {
          type: "semi-structured",
          studentName: safeStudentName,
          studentId,
          sessionId: sid,
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

    const sid = effectiveSessionIdRef.current;
    if (sid) {
      void finishSession(sid, {
        status: "concluida",
        motivoFinalizacao: MOTIVO_FINALIZACAO_MAP[motivo] ?? "outro",
        descricaoMotivo: motivo,
      });
    }

    router.push({
      pathname: "/session/completed",
      params: {
        type: "semi-structured",
        studentName: safeStudentName,
        studentId,
        sessionId: sid,
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
          subtitle={`Exercício Semi-estruturado`}
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
        <View className="mx-8 mt-5 mb-8">
          <PageHeader
            title={`Sessão de ${safeStudentName}`}
            subtitle="Circuito Semi-estruturado"
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

        {rcFormId && (
          <View className="mx-5 mt-4">
            <FormComponent
              ref={formRef}
              formularioId={rcFormId}
              sessaoId={effectiveSessionId}
              alunoId={""}
            />
          </View>
        )}
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
