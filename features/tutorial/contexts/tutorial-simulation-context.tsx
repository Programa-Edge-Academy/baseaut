import { TranslationKey } from "@/features/settings/constants/translations";
import {
  ROOT_GUARD_SCOPE,
  useGuardScope,
} from "@/features/tutorial/contexts/guard-scope-context";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";

/** One guided sub-step of a feature simulation. */
export type SimulationSubStep = {
  /** Stable key linking the sub-step to its spotlight target. */
  key: string;
  /** Hint shown when the user taps "Ask for help" during this sub-step. */
  hintKey: TranslationKey;
};

/** A registered spotlight target: the element to highlight and its shape. */
export type SpotlightTarget = {
  ref: React.RefObject<View | null>;
  /** Whether the highlight rectangle has rounded corners. */
  rounded: boolean;
  /** Surface the target was registered on, used to scope the tap guard. */
  scope: string;
};

/** Value exposed by {@link TutorialSimulationProvider}. */
export type TutorialSimulationValue = {
  /** Whether a guided simulation is currently running. */
  active: boolean;
  /** Key of the sub-step awaiting completion, or null when finished. */
  currentKey: string | null;
  /** Hint key of the current sub-step, or null when finished. */
  currentHintKey: TranslationKey | null;
  /** Whether the given key is the sub-step awaiting completion. */
  isCurrent: (key: string) => boolean;
  /** Marks a sub-step done; advances when it is the current one. */
  complete: (key: string) => void;
  /**
   * Registers a spotlight target under one or more sub-step keys. The surface it
   * belongs to is filled in automatically by {@link useTutorialSimulation}.
   */
  registerTarget: (
    keys: string | string[],
    ref: React.RefObject<View | null>,
    options?: { rounded?: boolean; scope?: string },
  ) => void;
  /** Removes previously registered target keys. */
  unregisterTarget: (keys: string | string[]) => void;
  /** Returns the spotlight target registered for a key, if any. */
  getTarget: (key: string) => SpotlightTarget | undefined;
  /**
   * Registers an area that stays interactive on every sub-step, regardless of
   * which one is highlighted. Used for data entry (form questions), which the
   * hints ask the user to fill even though the fields are never a highlight
   * target, so the tap guard must never block them.
   */
  registerPassthrough: (
    id: string,
    ref: React.RefObject<View | null>,
    scope?: string,
  ) => void;
  /** Removes a previously registered passthrough area. */
  unregisterPassthrough: (id: string) => void;
  /** Passthrough areas registered on the given surface. */
  getPassthroughs: (scope: string) => React.RefObject<View | null>[];
  /**
   * Registers a mounted {@link TutorialSpotlight} overlay and returns its id.
   * The most recently mounted overlay is the topmost surface (a modal mounts
   * after the screen), and only it draws the highlight — see
   * {@link activeSpotlightId}.
   */
  registerSpotlight: () => number;
  /** Removes a previously registered overlay by id. */
  unregisterSpotlight: (id: number) => void;
  /** Id of the topmost mounted overlay; only that overlay draws the highlight. */
  activeSpotlightId: number | null;
};

const INACTIVE: TutorialSimulationValue = {
  active: false,
  currentKey: null,
  currentHintKey: null,
  isCurrent: () => false,
  complete: () => {},
  registerTarget: () => {},
  unregisterTarget: () => {},
  getTarget: () => undefined,
  registerPassthrough: () => {},
  unregisterPassthrough: () => {},
  getPassthroughs: () => [],
  registerSpotlight: () => 0,
  unregisterSpotlight: () => {},
  activeSpotlightId: null,
};

const TutorialSimulationContext = createContext<TutorialSimulationValue>(INACTIVE);

/** Props for {@link TutorialSimulationProvider}. */
export type TutorialSimulationProviderProps = {
  /** Ordered sub-steps the user must complete, in sequence. */
  subSteps: SimulationSubStep[];
  /** Called once, after the final sub-step is completed. */
  onComplete: () => void;
  children: React.ReactNode;
};

/**
 * Drives a feature's guided tutorial simulation: it tracks which sub-step is
 * awaiting completion, exposes spotlight-target registration for the highlight
 * overlay, and fires {@link TutorialSimulationProviderProps.onComplete} when the
 * user finishes the last sub-step.
 *
 * @remarks
 * Components outside a provider receive an inert value, so the same screens work
 * unchanged in their normal (non-tutorial) mode.
 */
export function TutorialSimulationProvider({
  subSteps,
  onComplete,
  children,
}: TutorialSimulationProviderProps) {
  const [index, setIndex] = useState(0);
  const targetsRef = useRef<Map<string, SpotlightTarget>>(new Map());
  const passthroughsRef = useRef<
    Map<string, { ref: React.RefObject<View | null>; scope: string }>
  >(new Map());
  const [, forceRender] = useState(0);

  // Registry of mounted spotlight overlays. The last one mounted (a modal, which
  // mounts over the screen) is the topmost surface and the only one that draws.
  const spotlightSeq = useRef(0);
  const spotlightStack = useRef<number[]>([]);
  const [activeSpotlightId, setActiveSpotlightId] = useState<number | null>(null);

  const currentKey = index < subSteps.length ? subSteps[index].key : null;
  const currentHintKey =
    index < subSteps.length ? subSteps[index].hintKey : null;

  const complete = useCallback(
    (key: string) => {
      setIndex((current) => {
        if (current >= subSteps.length || subSteps[current].key !== key) {
          return current;
        }
        const next = current + 1;
        if (next >= subSteps.length) {
          setTimeout(onComplete, 0);
        }
        return next;
      });
    },
    [subSteps, onComplete],
  );

  const registerTarget = useCallback(
    (
      keys: string | string[],
      ref: React.RefObject<View | null>,
      options?: { rounded?: boolean; scope?: string },
    ) => {
      const list = Array.isArray(keys) ? keys : [keys];
      list.forEach((k) =>
        targetsRef.current.set(k, {
          ref,
          rounded: !!options?.rounded,
          scope: options?.scope ?? ROOT_GUARD_SCOPE,
        }),
      );
      forceRender((n) => n + 1);
    },
    [],
  );

  const unregisterTarget = useCallback((keys: string | string[]) => {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach((k) => targetsRef.current.delete(k));
    forceRender((n) => n + 1);
  }, []);

  const getTarget = useCallback(
    (key: string) => targetsRef.current.get(key),
    [],
  );

  const registerPassthrough = useCallback(
    (id: string, ref: React.RefObject<View | null>, scope?: string) => {
      passthroughsRef.current.set(id, {
        ref,
        scope: scope ?? ROOT_GUARD_SCOPE,
      });
      forceRender((n) => n + 1);
    },
    [],
  );

  const unregisterPassthrough = useCallback((id: string) => {
    passthroughsRef.current.delete(id);
    forceRender((n) => n + 1);
  }, []);

  const getPassthroughs = useCallback(
    (scope: string) =>
      Array.from(passthroughsRef.current.values())
        .filter((entry) => entry.scope === scope)
        .map((entry) => entry.ref),
    [],
  );

  const registerSpotlight = useCallback((): number => {
    const id = ++spotlightSeq.current;
    spotlightStack.current.push(id);
    setActiveSpotlightId(id);
    return id;
  }, []);

  const unregisterSpotlight = useCallback((id: number) => {
    spotlightStack.current = spotlightStack.current.filter((x) => x !== id);
    setActiveSpotlightId(
      spotlightStack.current[spotlightStack.current.length - 1] ?? null,
    );
  }, []);

  const value = useMemo<TutorialSimulationValue>(
    () => ({
      active: true,
      currentKey,
      currentHintKey,
      isCurrent: (key: string) => key === currentKey,
      complete,
      registerTarget,
      unregisterTarget,
      getTarget,
      registerPassthrough,
      unregisterPassthrough,
      getPassthroughs,
      registerSpotlight,
      unregisterSpotlight,
      activeSpotlightId,
    }),
    [
      currentKey,
      currentHintKey,
      complete,
      registerTarget,
      unregisterTarget,
      getTarget,
      registerPassthrough,
      unregisterPassthrough,
      getPassthroughs,
      registerSpotlight,
      unregisterSpotlight,
      activeSpotlightId,
    ],
  );

  return (
    <TutorialSimulationContext.Provider value={value}>
      {children}
    </TutorialSimulationContext.Provider>
  );
}

/**
 * Returns the current simulation state, or an inert value outside a provider.
 *
 * @remarks
 * Registrations are bound to the surface the caller renders on, so the tap guard
 * of a modal can tell its own targets from those of the screen behind it. Call
 * sites stay unchanged: the scope is read here rather than passed in.
 */
export function useTutorialSimulation(): TutorialSimulationValue {
  const value = useContext(TutorialSimulationContext);
  const scope = useGuardScope();

  return useMemo(
    () => ({
      ...value,
      registerTarget: (keys, ref, options) =>
        value.registerTarget(keys, ref, { ...options, scope }),
      registerPassthrough: (id, ref) =>
        value.registerPassthrough(id, ref, scope),
    }),
    [value, scope],
  );
}
