import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  SimulationSubStep,
  TutorialSimulationProvider,
} from "@/features/tutorial/contexts/tutorial-simulation-context";
import { useSessionGlobalContext } from "@/features/sessions/contexts/session-global-context";

/**
 * Controls the session tutorial simulation. Unlike the single-screen replicas
 * (alunos, exercicios, circuitos) that mount their own provider inside the
 * practice route, the session simulation spans several real routes
 * (circuit-selection → /session/*). This controller lives above the navigation
 * stack so the guided simulation state survives route changes.
 */
/** Which route-spanning tutorial simulation is running. */
export type RouteSimKind = "session" | "forms" | "history" | "analysis" | "reports" | null;

type SessionSimControllerValue = {
  /** Whether a route-spanning simulation is currently running. */
  active: boolean;
  /** Which simulation is running (session flow or forms flow). */
  kind: RouteSimKind;
  /** Starts a route-spanning simulation with its sub-steps and completion handler. */
  start: (
    kind: Exclude<RouteSimKind, null>,
    subSteps: SimulationSubStep[],
    onComplete: () => void,
  ) => void;
  /** Stops the running simulation. */
  stop: () => void;
};

const SessionSimControllerContext = createContext<SessionSimControllerValue>({
  active: false,
  kind: null,
  start: () => {},
  stop: () => {},
});

/**
 * Provides the session simulation controller and, while active, wraps its
 * children in a {@link TutorialSimulationProvider} so spotlights and sub-steps
 * work across the session routes. Keyed by a run id so each start begins from
 * the first sub-step.
 */
export function SessionSimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { closeTutorialSessions } = useSessionGlobalContext();
  const [state, setState] = useState<{
    active: boolean;
    kind: RouteSimKind;
    runId: number;
    subSteps: SimulationSubStep[];
    onComplete: () => void;
  }>({ active: false, kind: null, runId: 0, subSteps: [], onComplete: () => {} });

  const start = useCallback(
    (
      kind: Exclude<RouteSimKind, null>,
      subSteps: SimulationSubStep[],
      onComplete: () => void,
    ) => {
      setState((prev) => ({
        active: true,
        kind,
        runId: prev.runId + 1,
        subSteps,
        onComplete,
      }));
    },
    [],
  );

  const stop = useCallback(() => {
    // Discard any practice session left in memory so it never leaks into the
    // real global session widget after the tutorial is dismissed.
    closeTutorialSessions();
    setState((prev) => ({ ...prev, active: false, kind: null, subSteps: [] }));
  }, [closeTutorialSessions]);

  const handleComplete = useCallback(() => {
    closeTutorialSessions();
    setState((prev) => ({ ...prev, active: false, kind: null, subSteps: [] }));
    state.onComplete();
  }, [state, closeTutorialSessions]);

  const controller = useMemo<SessionSimControllerValue>(
    () => ({ active: state.active, kind: state.kind, start, stop }),
    [state.active, state.kind, start, stop],
  );

  return (
    <SessionSimControllerContext.Provider value={controller}>
      {state.active ? (
        <TutorialSimulationProvider
          key={state.runId}
          subSteps={state.subSteps}
          onComplete={handleComplete}
        >
          {children}
        </TutorialSimulationProvider>
      ) : (
        children
      )}
    </SessionSimControllerContext.Provider>
  );
}

/** Returns the session simulation controller (start/stop/active). */
export function useSessionSimController(): SessionSimControllerValue {
  return useContext(SessionSimControllerContext);
}
