import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@baseaut/tutorial-completed";

/** A transient request to move a running module to a specific step. */
type PendingStep = { moduleId: string; index: number };

/** Value exposed by {@link TutorialProvider}. */
type TutorialContextValue = {
  /** Ids of modules the user has completed at least once. */
  completed: string[];
  /** Whether a module has been completed. */
  isCompleted: (moduleId: string) => boolean;
  /** Marks a module as completed and persists it. */
  markCompleted: (moduleId: string) => void;
  /**
   * A pending request for a module screen to jump to a step, set after a
   * simulation completes so the module advances to its wrap-up step. Transient
   * (never persisted).
   */
  pendingStep: PendingStep | null;
  /** Requests that a running module jump to a step (e.g. after a simulation). */
  requestStep: (moduleId: string, index: number) => void;
  /** Clears a consumed {@link pendingStep}. */
  clearPendingStep: () => void;
};

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

/**
 * Tracks which tutorial modules the user has completed. State is persisted to
 * the user's `preferencias_usuario` row so it follows the account across
 * devices, with an AsyncStorage cache for instant startup and offline use.
 *
 * @remarks
 * Only completion is persisted. The mock data shown while playing a module is
 * ephemeral and always restarts from the beginning. The tutorial has no entry
 * point in the UI: the header and Settings shortcuts were removed, so its
 * screens are only reachable if a shortcut is reintroduced.
 */
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [pendingStep, setPendingStep] = useState<PendingStep | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const cachedCompleted = await AsyncStorage.getItem(STORAGE_KEY);
      if (active && cachedCompleted) {
        try {
          const parsed = JSON.parse(cachedCompleted);
          if (Array.isArray(parsed)) setCompleted(parsed);
        } catch {}
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from("preferencias_usuario")
        .select("tutorial_modulos_concluidos")
        .eq("usuario_id", userId)
        .maybeSingle();

      if (active && data) {
        const dbCompleted = (data.tutorial_modulos_concluidos ?? []) as string[];
        setCompleted(dbCompleted);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dbCompleted));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (nextCompleted: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextCompleted));
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    await supabase
      .from("preferencias_usuario")
      .update({ tutorial_modulos_concluidos: nextCompleted })
      .eq("usuario_id", userId);
  }, []);

  const markCompleted = useCallback(
    (moduleId: string) => {
      setCompleted((prev) => {
        if (prev.includes(moduleId)) return prev;
        const next = [...prev, moduleId];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const requestStep = useCallback((moduleId: string, index: number) => {
    setPendingStep({ moduleId, index });
  }, []);

  const clearPendingStep = useCallback(() => setPendingStep(null), []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      completed,
      isCompleted: (moduleId: string) => completed.includes(moduleId),
      markCompleted,
      pendingStep,
      requestStep,
      clearPendingStep,
    }),
    [completed, markCompleted, pendingStep, requestStep, clearPendingStep],
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}

/** Returns the tutorial completion/visibility state and updaters. */
export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return ctx;
}
