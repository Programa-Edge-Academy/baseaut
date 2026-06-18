import { colors } from "@/assets/colors";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { FormComponent } from "@/features/forms/components/form-component";
import { Check } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, ScrollView, Text, View } from "react-native";
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
import { useResumeSession } from "../hooks/use-resume-session";
import {
  useSessionFlow,
  type CrisisRecord,
  type ExecutionRecord,
  type MotivoFinalizacao,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";

/** Maps early-finish reason labels to the motivo_finalizacao_enum. */
const MOTIVO_FINALIZACAO_MAP: Record<string, MotivoFinalizacao> = {
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Tempo insuficiente": "tempo_esgotado",
};

/** Maps the result-modal reason labels to the motivo_nao_realizacao_enum. */
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
  circuitName = "Circuito",
  circuitType = "padrao",
  exercises = [],
  onPressBack,
  onFinishSession,
  onCompleteSession,
}: SessionRunningScreenProps) {
  const formRef = useRef<any>(null);
  const { createSession, persistExecutions, saveSession } = useSessionFlow();

  // ID efetivo da sessão: usa o recebido por parâmetro ou cria um na montagem.
  const [effectiveSessionId, setEffectiveSessionId] = useState<string>(
    sessionId || "",
  );
  const effectiveSessionIdRef = useRef<string>(sessionId || "");
  // Instância de Registro de Controle desta sessão (sessoes.formulario_id),
  // criada por trigger. O form inline grava as respostas nela.
  const [rcFormId, setRcFormId] = useState<string>("");
  // Promise da criação da sessão — usada por persistAndFinish para aguardar
  // o insert caso o usuário finalize antes de ele resolver.
  const createSessionPromiseRef = useRef<Promise<string> | null>(null);
  // Execuções acumuladas (status + dados clínicos) para gravar ao final.
  const executionsRef = useRef<ExecutionRecord[]>([]);
  // Segundos do cronômetro capturados na última parada.
  const lastElapsedSecondsRef = useRef<number | null>(null);

  // Botão de crise: episódios cronometrados de forma oculta, por exercício.
  const [isCriseActive, setIsCriseActive] = useState(false);
  const criseStartRef = useRef<number | null>(null);
  const crisesRef = useRef<CrisisRecord[]>([]);

  // Encerra a crise em andamento (se houver), retendo a duração para o exercício atual.
  const finalizeActiveCrise = () => {
    if (criseStartRef.current == null) return;
    const durationSeconds = (Date.now() - criseStartRef.current) / 1000;
    crisesRef.current = [
      ...crisesRef.current,
      { exercicioId: currentExercise.id, durationSeconds },
    ];
    criseStartRef.current = null;
    setIsCriseActive(false);
  };

  // Alterna o botão de crise: inicia uma nova contagem ou pausa a atual.
  const handleCrisePress = () => {
    if (criseStartRef.current == null) {
      criseStartRef.current = Date.now();
      setIsCriseActive(true);
    } else {
      finalizeActiveCrise();
    }
  };

  // Cria a sessão no banco quando ainda não há um id válido.
  useEffect(() => {
    if (!order.length || sessionId || !studentId) return;
    let active = true;
    const promise = (async () => {
      const id = await createSession({
        alunoId: studentId,
        circuitoId: circuitId ?? null,
      });
      // Sempre grava no ref (não depende de active) para que persistAndFinish
      // possa usar o id mesmo que o componente já tenha desmontado.
      effectiveSessionIdRef.current = id;
      if (active) setEffectiveSessionId(id);
      return id;
    })();
    createSessionPromiseRef.current = promise.catch((err) => {
      console.error("Erro ao criar sessão:", err);
      throw err;
    });
    return () => {
      active = false;
    };
  }, [sessionId, studentId, circuitId, createSession]);

  // Resolve a instância de RC da sessão para o formulário inline gravar nela.
  // Circuitos sem formulario_id configurado não disparam o trigger de criação
  // de instância — nesses casos cai no template global de RC como fallback.
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

  // Ao retomar (sessionId não vazio), carrega as execuções já gravadas.
  const { data: resumeData } = useResumeSession(sessionId || null);

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
  // Reconstrói o estado ao retomar uma sessão em_andamento.
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

    // Retoma no primeiro exercício da ordem original que ainda não tem execução.
    const resumeIndex = exercises.findIndex((ex) => !executed.has(ex.id));
    setCurrentIndex(resumeIndex === -1 ? exercises.length - 1 : resumeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData]);

  const isMabc =
    circuitType === "mabc_1" ||
    circuitType === "mabc_2" ||
    circuitType === "mabc_3";

  // States and refs for Success Toast feedback
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  // State for onPressCorner
  const [isFormVisible, setIsFormVisible] = useState(true);

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

  // Grava as execuções acumuladas e finaliza a sessão no banco.
  // Se createSession ainda estiver em-flight, aguarda seu resultado antes de prosseguir.
  const persistAndFinish = async (
    motivoFinalizacao: MotivoFinalizacao | null = null,
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
    try {
      await saveSession(sid, executionsRef.current, crisesRef.current, {
        status: "concluida",
        motivoFinalizacao,
        descricaoMotivo,
      });
    } catch (err) {
      console.error("Erro ao salvar a sessão:", err);
    }
  };

  // Tenta salvar o formulário sem bloquear a persistência da sessão.
  // Notifica o usuário se houver campos obrigatórios pendentes.
  const trySaveForm = () => {
    if (!formRef.current) return;
    void (formRef.current.handleSave() as Promise<any>).then((result: any) => {
      if (result && !result.success) {
        Alert.alert(
          "Atenção",
          "O registro de controle ficou pendente pois há campos obrigatórios não preenchidos.",
        );
      }
    });
  };

  const advanceSession = (
    statusAtual: "concluido" | "nao_realizada" | "adiado",
    record?: Omit<ExecutionRecord, "exercicioId" | "ordemExecucao">,
  ) => {
    // Garante que qualquer crise em andamento seja atribuída a este exercício
    // antes de trocar de atividade.
    finalizeActiveCrise();

    setStage("ready");
    setHasAdvanced(true);

    const historicoAtualizado = {
      ...historicoExercicios,
      [currentExercise.id]: statusAtual,
    };

    setHistoricoExercicios(historicoAtualizado);

    // Apenas realizada/não realizada viram execução; adiado fica pendente.
    if (record) {
      const newRecord: ExecutionRecord = {
        exercicioId: currentExercise.id,
        ordemExecucao: currentIndex + 1,
        ...record,
      };
      executionsRef.current = [...executionsRef.current, newRecord];

      // Persiste incrementalmente para que a sessão possa ser retomada.
      const sid = effectiveSessionIdRef.current;
      if (sid) void persistExecutions(sid, [newRecord]);
    }
    lastElapsedSecondsRef.current = null;

    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
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
          <Text className="text-white text-base text-center font-medium">
            Não foi possível carregar os exercícios do circuito.
          </Text>
        </View>
      </View>
    );
  }

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
    // Encerra uma crise eventualmente ativa antes de finalizar a sessão.
    finalizeActiveCrise();

    if (formRef.current) {
      formRef.current.handleSave();
    }

    const pendentes = order.filter(
      (ex) =>
        historicoExercicios[ex.id] !== "concluido" &&
        historicoExercicios[ex.id] !== "adiado",
    );
    const temPendencias = pendentes.length > 0;

    void persistAndFinish(MOTIVO_FINALIZACAO_MAP[motivo] ?? "outro", motivo);
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
                onPressCrise={handleCrisePress}
                isCriseActive={isCriseActive}
                onStop={handleStop}
                isFormVisible={isFormVisible} // Nova prop
                onPressCorner={() => setIsFormVisible(!isFormVisible)} // Alterna o estado
              />
            )}

            {/*
            TODO: form questions section (Contato visual com pessoas, etc.)
            is out of scope here — wire to features/forms once available.
            Placeholder block kept so the layout reflects the design intent.
          */}
            {/* Circuitos MABC não usam o Registro de Controle dentro da sessão. */}
            {!isMabc && rcFormId && (
              <View style={{ display: isFormVisible ? "flex" : "none" }}>
                <FormComponent
                  ref={formRef}
                  formularioId={rcFormId}
                  sessaoId={effectiveSessionId}
                  alunoId={""}
                />
              </View>
            )}
          </ScrollView>
        </View>

        <ReorderModal
          visible={isReorderOpen}
          items={order}
          currentIndex={currentIndex}
          onClose={() => setIsReorderOpen(false)}
          onReorder={setOrder}
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
      </View>
    </>
  );
}
