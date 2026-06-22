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
  /** Visibilidade do Registro de Controle inline (toggle por sessão). */
  isFormVisible?: boolean;
  /** Duração total da sessão em segundos (cronômetro contínuo, máx. 3h). */
  totalElapsed?: number;
  /** Intervalos das fugas (início/fim no cronômetro total) para o RC. */
  fugaIntervals?: { start: number; end: number }[];
}

/** Limite de contagem do cronômetro total da sessão: 3 horas. */
export const SESSION_TOTAL_CAP_SECONDS = 3 * 60 * 60;

/** Formata segundos como mm:ss (ou h:mm:ss a partir de 1h). */
export function formatSessionClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
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
  setFormVisible: (sessionId: string, isVisible: boolean) => void;
  addFugaInterval: (
    sessionId: string,
    interval: { start: number; end: number },
  ) => void;
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
          let entry = next[key];
          let changed = false;

          // Cronômetro do exercício: conta apenas quando "rodando".
          if (entry.isRunning) {
            entry = { ...entry, timeElapsed: entry.timeElapsed + 1 };
            changed = true;
          }

          // Cronômetro TOTAL da sessão: conta sempre enquanto a sessão existe
          // (independe de pausa/exercício), até o teto de 3h.
          const total = entry.totalElapsed ?? 0;
          if (total < SESSION_TOTAL_CAP_SECONDS) {
            entry = { ...entry, totalElapsed: total + 1 };
            changed = true;
          }

          if (changed) {
            next[key] = entry;
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
        // Default visível ao iniciar qualquer sessão; preserva o toggle ao retomar.
        isFormVisible: prev[session.sessionId]?.isFormVisible ?? session.isFormVisible ?? true,
        // Cronômetro total contínuo; preserva o acumulado ao retomar.
        totalElapsed: prev[session.sessionId]?.totalElapsed ?? session.totalElapsed ?? 0,
        // Fugas acumuladas; preserva ao retomar.
        fugaIntervals: prev[session.sessionId]?.fugaIntervals ?? session.fugaIntervals ?? [],
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

  const setFormVisible = (sessionId: string, isVisible: boolean) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      if (prev[sessionId].isFormVisible === isVisible) return prev;
      return {
        ...prev,
        [sessionId]: { ...prev[sessionId], isFormVisible: isVisible },
      };
    });
  };

  const addFugaInterval = (
    sessionId: string,
    interval: { start: number; end: number },
  ) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      const current = prev[sessionId].fugaIntervals ?? [];
      return {
        ...prev,
        [sessionId]: { ...prev[sessionId], fugaIntervals: [...current, interval] },
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
        setFormVisible,
        addFugaInterval,
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
