import React, { useState } from "react";
import { Alert } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSessionGlobalContext } from "../contexts/session-global-context";
import { useSessionFlow } from "../hooks/use-session-flow";
import { SessionResumeWidget } from "@/components/session-resume-widget";

export function GlobalSessionWidget() {
  const { activeSessions, toggleTimer, closeSession } = useSessionGlobalContext();
  const { finishSession } = useSessionFlow();
  const router = useRouter();
  const pathname = usePathname();

  // Usar estado local para navegar entre as sessões múltiplas
  // MUST be before any conditional returns (Rules of Hooks)
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handleClose = () => {
    Alert.alert(
      "Cancelar sessão",
      "Tem certeza que deseja cancelar esta sessão? Os exercícios já realizados serão mantidos, mas a sessão será encerrada.",
      [
        { text: "Não, continuar", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: () => {
            void finishSession(sessionData.sessionId, { status: "cancelada" });
            closeSession(sessionData.sessionId);
          },
        },
      ]
    );
  };

  return (
    <SessionResumeWidget
      mode={mode}
      studentName={sessionData.studentName}
      exerciseProgress={sessionData.exerciseProgress}
      timeElapsed={formatTime(sessionData.timeElapsed)}
      isPlaying={sessionData.isRunning}
      onTogglePlay={() => toggleTimer(sessionData.sessionId)}
      onPress={handlePress}
      onClose={handleClose}
      onNext={handleNext}
      onPrev={handlePrev}
    />
  );
}
