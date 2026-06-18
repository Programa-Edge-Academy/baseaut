import React, { useState } from "react";
import { usePathname, useRouter } from "expo-router";
import { useSessionGlobalContext } from "../contexts/session-global-context";
import { SessionResumeWidget } from "@/components/session-resume-widget";

export function GlobalSessionWidget() {
  const { activeSessions, toggleTimer } = useSessionGlobalContext();
  const pathname = usePathname();
  const router = useRouter();
  
  // Do not show if we are on a session running screen
  if (pathname.includes("/session/semi-structured") || pathname.includes("/session/structured")) {
    return null;
  }

  const sessionIds = Object.keys(activeSessions);
  if (sessionIds.length === 0) {
    return null;
  }

  const mode = sessionIds.length > 1 ? "multiple" : "single";
  // Usar estado local para navegar entre as sessões múltiplas
  const [currentIndex, setCurrentIndex] = useState(0);

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
    // Redireciona para a tela da sessão
    if (sessionData.type === "semi-structured") {
      router.push({
        pathname: "/session/semi-structured",
        params: {
          sessionId: sessionData.sessionId,
          studentId: sessionData.studentId,
          studentName: sessionData.studentName,
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

  return (
    <SessionResumeWidget
      mode={mode}
      studentName={sessionData.studentName}
      exerciseProgress={sessionData.exerciseProgress}
      timeElapsed={formatTime(sessionData.timeElapsed)}
      isPlaying={sessionData.isRunning}
      onTogglePlay={() => toggleTimer(sessionData.sessionId)}
      onPress={handlePress}
      onNext={handleNext}
      onPrev={handlePrev}
    />
  );
}
