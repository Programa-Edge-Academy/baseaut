import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type SessionType = "semi-structured" | "structured";

export interface ActiveSessionInfo {
  sessionId: string;
  studentId: string;
  studentName: string;
  type: SessionType;
  timeElapsed: number;
  isRunning: boolean;
  exerciseProgress: string;
  exercisesJson?: string;
  circuitId?: string;
  circuitName?: string;
  /** Histórico de execuções (exercicioId -> status) — persiste ao sair da tela */
  historico?: Record<string, "concluido" | "nao_realizada" | "adiado">;
  /** ID do exercício ativo ao sair da tela */
  activeExerciseId?: string;
  /** Flag para evitar conflito visual entre widget e cronômetro da tela */
  isTimerVisibleOnScreen?: boolean;
  /** Indica se a atividade atual é um exercício de engajamento */
  isEngagementRunning?: boolean;
}

interface SessionGlobalContextData {
  activeSessions: Record<string, ActiveSessionInfo>;
  registerSession: (session: ActiveSessionInfo) => void;
  updateSessionProgress: (sessionId: string, progress: string) => void;
  updateSessionState: (
    sessionId: string,
    state: {
      historico?: Record<string, "concluido" | "nao_realizada" | "adiado">;
      activeExerciseId?: string | null;
      isEngagementRunning?: boolean;
    }
  ) => void;
  toggleTimer: (sessionId: string, isRunning?: boolean) => void;
  setTimerVisible: (sessionId: string, isVisible: boolean) => void;
  closeSession: (sessionId: string) => void;
  updateTimeElapsed: (sessionId: string, seconds: number) => void;
}

const SessionGlobalContext = createContext<SessionGlobalContextData>({} as SessionGlobalContextData);

export function SessionGlobalProvider({ children }: { children: ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Record<string, ActiveSessionInfo>>({});

  // Global ticking interval
  useEffect(() => {
    const id = setInterval(() => {
      setActiveSessions((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        for (const key in next) {
          if (next[key].isRunning) {
            next[key] = { ...next[key], timeElapsed: next[key].timeElapsed + 1 };
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const registerSession = (session: ActiveSessionInfo) => {
    setActiveSessions((prev) => ({
      ...prev,
      [session.sessionId]: {
        ...session,
        // Preserve runtime state if session already existed (navigation round-trip)
        timeElapsed: prev[session.sessionId]?.timeElapsed ?? session.timeElapsed ?? 0,
        isRunning: prev[session.sessionId]?.isRunning ?? session.isRunning ?? true,
        historico: prev[session.sessionId]?.historico ?? session.historico,
        activeExerciseId: prev[session.sessionId]?.activeExerciseId ?? session.activeExerciseId,
        isEngagementRunning: prev[session.sessionId]?.isEngagementRunning ?? session.isEngagementRunning ?? false,
      },
    }));
  };

  const updateSessionProgress = (sessionId: string, progress: string) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      return { ...prev, [sessionId]: { ...prev[sessionId], exerciseProgress: progress } };
    });
  };

  const updateSessionState = (
    sessionId: string,
    state: {
      historico?: Record<string, "concluido" | "nao_realizada" | "adiado">;
      activeExerciseId?: string | null;
      isEngagementRunning?: boolean;
    }
  ) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      return {
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          ...(state.historico !== undefined ? { historico: state.historico } : {}),
          ...(state.activeExerciseId !== undefined ? { activeExerciseId: state.activeExerciseId ?? undefined } : {}),
          ...(state.isEngagementRunning !== undefined ? { isEngagementRunning: state.isEngagementRunning } : {}),
        },
      };
    });
  };

  const toggleTimer = (sessionId: string, forceIsRunning?: boolean) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      const nextIsRunning = forceIsRunning !== undefined ? forceIsRunning : !prev[sessionId].isRunning;
      return {
        ...prev,
        [sessionId]: { ...prev[sessionId], isRunning: nextIsRunning },
      };
    });
  };

  const setTimerVisible = (sessionId: string, isVisible: boolean) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      if (prev[sessionId].isTimerVisibleOnScreen === isVisible) return prev;
      return {
        ...prev,
        [sessionId]: { ...prev[sessionId], isTimerVisibleOnScreen: isVisible },
      };
    });
  };

  const updateTimeElapsed = (sessionId: string, seconds: number) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      return {
        ...prev,
        [sessionId]: { ...prev[sessionId], timeElapsed: seconds },
      };
    });
  };

  const closeSession = (sessionId: string) => {
    setActiveSessions((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  };

  return (
    <SessionGlobalContext.Provider
      value={{
        activeSessions,
        registerSession,
        updateSessionProgress,
        updateSessionState,
        toggleTimer,
        setTimerVisible,
        closeSession,
        updateTimeElapsed,
      }}
    >
      {children}
    </SessionGlobalContext.Provider>
  );
}

export function useSessionGlobalContext() {
  const context = useContext(SessionGlobalContext);
  if (!context) {
    throw new Error("useSessionGlobalContext must be used within a SessionGlobalProvider");
  }
  return context;
}
