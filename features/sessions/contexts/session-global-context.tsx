import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

/** Execution mode of an active session. */
export type SessionType = "semi-structured" | "structured";

/** Runtime state of a session tracked globally so it survives navigation. */
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
  /** Execution history (exerciseId -> status); persists when leaving the screen. */
  historico?: Record<string, "concluido" | "nao_realizada" | "adiado">;
  /** Id of the active exercise when leaving the screen. */
  activeExerciseId?: string;
  /** Avoids a visual conflict between the widget and the on-screen stopwatch. */
  isTimerVisibleOnScreen?: boolean;
  /** Whether the current activity is an engagement exercise. */
  isEngagementRunning?: boolean;
  /** Visibility of the inline Control Record (per-session toggle). */
  isFormVisible?: boolean;
  /** Total session duration in seconds (continuous stopwatch, capped at 3h). */
  totalElapsed?: number;
  /** Flight intervals (start/end on the total stopwatch) used by the Control Record. */
  fugaIntervals?: { start: number; end: number }[];
  /**
   * True when the session was started inside a tutorial simulation (mock data).
   * The global session widget never surfaces these, and concurrent-session
   * detection ignores them outside a tutorial, so a practice session left
   * running never leaks into the real app.
   */
  isTutorial?: boolean;
}

/** Cap for the total session stopwatch: 3 hours. */
export const SESSION_TOTAL_CAP_SECONDS = 3 * 60 * 60;

/** Formats seconds as mm:ss (or h:mm:ss from one hour on). */
export function formatSessionClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Value exposed by the global session context. */
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
  /** Removes every tutorial/mock session at once (called when a sim ends). */
  closeTutorialSessions: () => void;
  updateTimeElapsed: (sessionId: string, seconds: number) => void;
}

const SessionGlobalContext = createContext<SessionGlobalContextData>({} as SessionGlobalContextData);

/**
 * Provides the global registry of active sessions and a 1-second ticker that
 * advances each session's exercise and total stopwatches (the total runs
 * continuously up to {@link SESSION_TOTAL_CAP_SECONDS}).
 */
export function SessionGlobalProvider({ children }: { children: ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Record<string, ActiveSessionInfo>>({});

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSessions((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        for (const key in next) {
          let entry = next[key];
          let changed = false;

          if (entry.isRunning) {
            entry = { ...entry, timeElapsed: entry.timeElapsed + 1 };
            changed = true;
          }

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
        timeElapsed: prev[session.sessionId]?.timeElapsed ?? session.timeElapsed ?? 0,
        isRunning: prev[session.sessionId]?.isRunning ?? session.isRunning ?? true,
        historico: prev[session.sessionId]?.historico ?? session.historico,
        activeExerciseId: prev[session.sessionId]?.activeExerciseId ?? session.activeExerciseId,
        isEngagementRunning: prev[session.sessionId]?.isEngagementRunning ?? session.isEngagementRunning ?? false,
        isFormVisible: prev[session.sessionId]?.isFormVisible ?? session.isFormVisible ?? true,
        totalElapsed: prev[session.sessionId]?.totalElapsed ?? session.totalElapsed ?? 0,
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

  const closeTutorialSessions = () => {
    setActiveSessions((prev) => {
      const ids = Object.keys(prev).filter(
        (id) => prev[id].isTutorial || id.startsWith("mock-"),
      );
      if (ids.length === 0) return prev;
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
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
        closeTutorialSessions,
        updateTimeElapsed,
      }}
    >
      {children}
    </SessionGlobalContext.Provider>
  );
}

/** Returns the global session context, throwing if used outside its provider. */
export function useSessionGlobalContext() {
  const context = useContext(SessionGlobalContext);
  if (!context) {
    throw new Error("useSessionGlobalContext must be used within a SessionGlobalProvider");
  }
  return context;
}
