import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect } from "react";
import { View } from "react-native";

/** Props for {@link SpotlightBinding}. */
export type SpotlightBindingProps = {
  /** Sub-step key(s) the referenced view is the spotlight target for. */
  targetKey?: string | string[];
  /** Ref of the already-rendered view to highlight. */
  viewRef: React.RefObject<View | null>;
  /** Whether the highlight has rounded corners. Defaults to true. */
  rounded?: boolean;
};

/**
 * Registers an existing view ref as a spotlight target, rendering nothing.
 *
 * @remarks
 * Use it inside a modal whose target ref is held by the component that renders
 * the modal. Registering from the outer component would bind the target to the
 * screen's surface, and the modal's tap guard — seeing a target it does not own
 * — would leave its own content unblocked. Rendering this inside the modal binds
 * the target to the modal instead, without wrapping the view in an extra layout
 * node the way {@link file://./spotlight-target.tsx} does.
 */
export function SpotlightBinding({
  targetKey,
  viewRef,
  rounded = true,
}: SpotlightBindingProps) {
  const sim = useTutorialSimulation();

  const keyDep = Array.isArray(targetKey) ? targetKey.join(",") : targetKey;
  useEffect(() => {
    if (!targetKey || (Array.isArray(targetKey) && targetKey.length === 0)) {
      return;
    }
    sim.registerTarget(targetKey, viewRef, { rounded });
    return () => sim.unregisterTarget(targetKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, keyDep, rounded, viewRef]);

  return null;
}
