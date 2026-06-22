import React, { useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { useSessionGlobalContext } from "../contexts/session-global-context";
import {
  useSessionFlow,
  type MotivoNaoRealizacao,
} from "../hooks/use-session-flow";
import {
  DEFAULT_FINISH_MOTIVOS,
  FinishSessionModal,
} from "./finish-session-modal";
import { SessionResumeWidget } from "@/components/session-resume-widget";

/** Mapeia os rótulos do modal de finalização para o motivo_nao_realizacao_enum. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

export function GlobalSessionWidget() {
  const { activeSessions, toggleTimer, closeSession } = useSessionGlobalContext();
  const { finishSessionAndSaveUnexecuted, finalizeSessionAutoFill } = useSessionFlow();
  const router = useRouter();
  const pathname = usePathname();

  // Usar estado local para navegar entre as sessões múltiplas
  // MUST be before any conditional returns (Rules of Hooks)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishOpen, setIsFinishOpen] = useState(false);

  // Restringir a exibição apenas nas telas iniciais (abas principais) e na tela de seleção de circuito
  const isRootScreen = pathname === "/students" || pathname === "/exercises" || pathname === "/analysis" || pathname === "/circuit-selection";
  if (!isRootScreen) {
    return null;
  }

  // Consider only sessions where the timer is NOT visible natively on screen.
  // The session is inherently active if it is in the activeSessions context.
  const sessionIds = Object.keys(activeSessions).filter((id) => {
    const session = activeSessions[id];
    return !session.isTimerVisibleOnScreen;
  });

  if (sessionIds.length === 0) {
    return null;
  }

  const mode = sessionIds.length > 1 ? "multiple" : "single";

  // Garantir que o index é válido caso uma sessão seja fechada
  const safeIndex = currentIndex >= sessionIds.length ? 0 : currentIndex;
  const currentSessionId = sessionIds[safeIndex];
  const sessionData = activeSessions[currentSessionId];

  if (!sessionData) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sessionIds.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + sessionIds.length) % sessionIds.length);
  };

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60).toString().padStart(2, "0");
    const secs = (safe % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handlePress = () => {
    if (sessionData.isEngagementRunning) {
      router.push({
        pathname: "/session/engagement",
        params: {
          sessionId: sessionData.sessionId,
          studentId: sessionData.studentId,
          studentName: sessionData.studentName,
          fromWidget: "true",
        },
      });
    } else if (sessionData.type === "semi-structured") {
      router.push({
        pathname: "/session/semi-structured",
        params: {
          sessionId: sessionData.sessionId,
          studentId: sessionData.studentId,
          studentName: sessionData.studentName,
          exercises: sessionData.exercisesJson ?? "[]",
          circuitId: sessionData.circuitId ?? "",
          circuitName: sessionData.circuitName ?? "Circuito",
        },
      });
    } else {
      router.push({
        pathname: "/session/structured",
        params: {
          sessionId: sessionData.sessionId,
          studentId: sessionData.studentId,
          studentName: sessionData.studentName,
        },
      });
    }
  };

  // Finaliza pelo widget como uma finalização NORMAL de sessão (concluida),
  // usando o mesmo modal de motivo da execução — não cancela mais a sessão.
  const handleConfirmFinish = (motivo: string) => {
    setIsFinishOpen(false);
    const sid = sessionData.sessionId;
    const total = sessionData.totalElapsed ?? 0;
    const fugas = sessionData.fugaIntervals ?? [];
    const motivoEnum = MOTIVO_NAO_REALIZACAO_MAP[motivo] ?? "outro";
    void (async () => {
      // Conclui a sessão (salvando exercícios não realizados no estruturado).
      await finishSessionAndSaveUnexecuted(sid, motivoEnum, motivo);
      // Replica tempo total e fugas (do contexto global) no RC.
      await finalizeSessionAutoFill(sid, total, fugas);
    })();
    closeSession(sid);
  };

  return (
    <>
      <SessionResumeWidget
        mode={mode}
        studentName={sessionData.studentName}
        exerciseProgress={sessionData.exerciseProgress}
        timeElapsed={formatTime(sessionData.timeElapsed)}
        isPlaying={sessionData.isRunning}
        onTogglePlay={() => toggleTimer(sessionData.sessionId)}
        onPress={handlePress}
        onClose={() => setIsFinishOpen(true)}
        onNext={handleNext}
        onPrev={handlePrev}
      />

      <FinishSessionModal
        visible={isFinishOpen}
        motivos={DEFAULT_FINISH_MOTIVOS}
        onClose={() => setIsFinishOpen(false)}
        onConfirm={handleConfirmFinish}
      />
    </>
  );
}
