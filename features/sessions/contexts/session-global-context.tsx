import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type SessionType = "semi-structured" | "structured";

export interface ActiveSessionInfo {
  sessionId: string;
  studentId: string;
  studentName: string;
  type: SessionType;
  timeElapsed: number; // in seconds
  isRunning: boolean;
  exerciseProgress: string; // e.g. "Exercício 1/3" ou "Tempo Livre"
}

interface SessionGlobalContextData {
  activeSessions: Record<string, ActiveSessionInfo>;
  registerSession: (session: ActiveSessionInfo) => void;
  updateSessionProgress: (sessionId: string, progress: string) => void;
  toggleTimer: (sessionId: string, isRunning?: boolean) => void;
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
        // Preserve previous time and running state if it already existed (e.g. strict re-renders)
        timeElapsed: prev[session.sessionId]?.timeElapsed ?? session.timeElapsed ?? 0,
        isRunning: prev[session.sessionId]?.isRunning ?? session.isRunning ?? true,
      },
    }));
  };

  const updateSessionProgress = (sessionId: string, progress: string) => {
    setActiveSessions((prev) => {
      if (!prev[sessionId]) return prev;
      return {
        ...prev,
        [sessionId]: { ...prev[sessionId], exerciseProgress: progress },
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
        toggleTimer,
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
