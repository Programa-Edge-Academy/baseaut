import React, { useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { useI18n } from "@/features/settings/contexts/i18n-context";
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

/** Maps the finish modal's labels to the `motivo_nao_realizacao_enum` values. */
const MOTIVO_NAO_REALIZACAO_MAP: Record<string, MotivoNaoRealizacao> = {
  "Recusa do aluno": "recusa_aluno",
  "Comportamento disruptivo": "comportamento_disruptivo",
  "Fadiga ou cansaço": "fadiga_cansaco",
  "Tempo insuficiente": "tempo_insuficiente",
  "Dificuldade física": "dificuldade_fisica",
  Outro: "outro",
};

/**
 * Floating mini-player shown on the main tabs and the circuit selection screen
 * for any active session not currently displaying its own on-screen stopwatch.
 * Lets the user switch between concurrent sessions, resume one, or finish it.
 */
export function GlobalSessionWidget() {
  const { t } = useI18n();
  const { activeSessions, toggleTimer, closeSession } = useSessionGlobalContext();
  const { finishSessionAndSaveUnexecuted, finalizeSessionAutoFill } = useSessionFlow();
  const router = useRouter();
  const pathname = usePathname();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishOpen, setIsFinishOpen] = useState(false);

  const isRootScreen = pathname === "/students" || pathname === "/exercises" || pathname === "/analysis" || pathname === "/circuit-selection";
  if (!isRootScreen) {
    return null;
  }

  const sessionIds = Object.keys(activeSessions).filter((id) => {
    const session = activeSessions[id];
    // Practice sessions started inside a tutorial never surface in the widget.
    // They are flagged with `isTutorial` and always use an in-memory `mock-`
    // id, so either signal keeps them out even if the flag is ever missed.
    const isTutorialSession = session.isTutorial || id.startsWith("mock-");
    return !session.isTimerVisibleOnScreen && !isTutorialSession;
  });

  if (sessionIds.length === 0) {
    return null;
  }

  const mode = sessionIds.length > 1 ? "multiple" : "single";

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
          circuitName: sessionData.circuitName ?? t("common.circuit"),
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

  const pendingExercises = (() => {
    try {
      const exs = JSON.parse(sessionData.exercisesJson ?? "[]") as {
        id: string;
        name: string;
      }[];
      const hist = sessionData.historico ?? {};
      return exs
        .filter((e) => hist[e.id] !== "concluido" && hist[e.id] !== "adiado")
        .map((e) => e.name);
    } catch {
      return [];
    }
  })();

  const handleConfirmFinish = (motivos: string[], descricao?: string) => {
    setIsFinishOpen(false);
    const sid = sessionData.sessionId;
    const total = sessionData.totalElapsed ?? 0;
    const fugas = sessionData.fugaIntervals ?? [];
    const mapped = motivos.map((m) => MOTIVO_NAO_REALIZACAO_MAP[m] ?? "outro");
    const motivoEnums = mapped.length > 0 ? mapped : ["outro" as const];
    void (async () => {
      await finishSessionAndSaveUnexecuted(
        sid,
        motivoEnums,
        descricao ?? motivos.join(", "),
      );
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
        pendingExercises={pendingExercises}
        onClose={() => setIsFinishOpen(false)}
        onConfirm={handleConfirmFinish}
      />
    </>
  );
}
