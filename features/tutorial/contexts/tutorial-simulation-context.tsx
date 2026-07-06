import { TranslationKey } from "@/features/settings/constants/translations";
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
  /** Registers a spotlight target under one or more sub-step keys. */
  registerTarget: (
    keys: string | string[],
    ref: React.RefObject<View | null>,
    options?: { rounded?: boolean },
  ) => void;
  /** Removes previously registered target keys. */
  unregisterTarget: (keys: string | string[]) => void;
  /** Returns the spotlight target registered for a key, if any. */
  getTarget: (key: string) => SpotlightTarget | undefined;
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
  const [, forceRender] = useState(0);

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
      options?: { rounded?: boolean },
    ) => {
      const list = Array.isArray(keys) ? keys : [keys];
      list.forEach((k) =>
        targetsRef.current.set(k, { ref, rounded: !!options?.rounded }),
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
    }),
    [currentKey, currentHintKey, complete, registerTarget, unregisterTarget, getTarget],
  );

  return (
    <TutorialSimulationContext.Provider value={value}>
      {children}
    </TutorialSimulationContext.Provider>
  );
}

/** Returns the current simulation state, or an inert value outside a provider. */
export function useTutorialSimulation(): TutorialSimulationValue {
  return useContext(TutorialSimulationContext);
}
