import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppState } from "react-native";

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
   * Wall-clock instant (ms) the running stretch of the exercise stopwatch
   * started at, or `null` while it is paused. Owned by
   * {@link SessionGlobalProvider}; callers never set it.
   */
  timerStartedAtMs?: number | null;
  /** Exercise seconds accumulated before {@link ActiveSessionInfo.timerStartedAtMs}. */
  timerBaseSeconds?: number;
  /** Wall-clock instant (ms) the total stopwatch counts from. */
  totalStartedAtMs?: number;
  /** Total seconds accumulated before {@link ActiveSessionInfo.totalStartedAtMs}. */
  totalBaseSeconds?: number;
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

/**
 * Recomputes both stopwatches of a session from their wall-clock anchors.
 *
 * @param session - Session entry to refresh.
 * @param nowMs - Reference instant, normally `Date.now()`.
 * @returns The session with updated `timeElapsed`/`totalElapsed`, or the same
 *   reference when neither value changed.
 */
function tickSession(session: ActiveSessionInfo, nowMs: number): ActiveSessionInfo {
  const secondsSince = (startedAtMs: number) =>
    Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));

  const timeElapsed =
    (session.timerBaseSeconds ?? 0) +
    (session.isRunning && session.timerStartedAtMs != null
      ? secondsSince(session.timerStartedAtMs)
      : 0);
  const totalElapsed = Math.min(
    SESSION_TOTAL_CAP_SECONDS,
    (session.totalBaseSeconds ?? 0) +
      (session.totalStartedAtMs != null ? secondsSince(session.totalStartedAtMs) : 0),
  );

  if (timeElapsed === session.timeElapsed && totalElapsed === session.totalElapsed) {
    return session;
  }
  return { ...session, timeElapsed, totalElapsed };
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
 * refreshes each session's exercise and total stopwatches (the total runs
 * continuously up to {@link SESSION_TOTAL_CAP_SECONDS}).
 *
 * @remarks
 * Neither stopwatch is incremented by the ticker: both are derived from the
 * wall-clock anchors kept on the session entry ({@link tickSession}). Android
 * suspends JavaScript timers while the screen is off, so a counter advanced one
 * second per tick silently lost every second the device slept — the reason the
 * stopwatch appeared to stop when the user locked the phone mid-session. With
 * the anchors the ticker only refreshes what is displayed, and the elapsed time
 * is already correct the moment the screen comes back. The same recomputation
 * runs on the `AppState` transition to `active` so the UI catches up without
 * waiting for the next tick.
 */
export function SessionGlobalProvider({ children }: { children: ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Record<string, ActiveSessionInfo>>({});

  useEffect(() => {
    const refresh = () => {
      const nowMs = Date.now();
      setActiveSessions((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        for (const key in next) {
          const ticked = tickSession(next[key], nowMs);
          if (ticked !== next[key]) {
            next[key] = ticked;
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    };

    const id = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, []);

  const registerSession = (session: ActiveSessionInfo) => {
    const nowMs = Date.now();
    setActiveSessions((prev) => {
      const existing = prev[session.sessionId];
      const isRunning = existing?.isRunning ?? session.isRunning ?? true;
      return {
        ...prev,
        [session.sessionId]: {
          ...session,
          timeElapsed: existing?.timeElapsed ?? session.timeElapsed ?? 0,
          isRunning,
          historico: existing?.historico ?? session.historico,
          activeExerciseId: existing?.activeExerciseId ?? session.activeExerciseId,
          isEngagementRunning: existing?.isEngagementRunning ?? session.isEngagementRunning ?? false,
          isFormVisible: existing?.isFormVisible ?? session.isFormVisible ?? true,
          totalElapsed: existing?.totalElapsed ?? session.totalElapsed ?? 0,
          fugaIntervals: existing?.fugaIntervals ?? session.fugaIntervals ?? [],
          timerBaseSeconds: existing?.timerBaseSeconds ?? session.timeElapsed ?? 0,
          timerStartedAtMs: existing?.timerStartedAtMs ?? (isRunning ? nowMs : null),
          totalBaseSeconds: existing?.totalBaseSeconds ?? session.totalElapsed ?? 0,
          totalStartedAtMs: existing?.totalStartedAtMs ?? nowMs,
        },
      };
    });
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
    const nowMs = Date.now();
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      const current = tickSession(prev[sessionId], nowMs);
      const nextIsRunning = forceIsRunning !== undefined ? forceIsRunning : !current.isRunning;
      if (nextIsRunning === current.isRunning) {
        return current === prev[sessionId] ? prev : { ...prev, [sessionId]: current };
      }
      return {
        ...prev,
        [sessionId]: {
          ...current,
          isRunning: nextIsRunning,
          timerBaseSeconds: current.timeElapsed,
          timerStartedAtMs: nextIsRunning ? nowMs : null,
        },
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
    const nowMs = Date.now();
    setActiveSessions((prev) => {
      const current = prev[sessionId];
      if (!current) return prev;
      return {
        ...prev,
        [sessionId]: {
          ...current,
          timeElapsed: seconds,
          timerBaseSeconds: seconds,
          timerStartedAtMs: current.isRunning ? nowMs : null,
        },
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
