import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect, useRef } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

/** Props for {@link SpotlightTarget}. */
export type SpotlightTargetProps = {
  /** Sub-step key(s) this element is the spotlight target for. */
  targetKey: string | string[];
  /** Whether the highlight has rounded corners. Defaults to true. */
  rounded?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Wraps a child in a measured view and registers it as the spotlight target for
 * a simulation sub-step. Use it to highlight elements without a context menu
 * (e.g. whole cards or buttons). Inert outside a simulation provider.
 */
export function SpotlightTarget({
  targetKey,
  rounded = true,
  className,
  style,
  children,
}: SpotlightTargetProps) {
  const sim = useTutorialSimulation();
  const ref = useRef<View>(null);

  const keyDep = Array.isArray(targetKey) ? targetKey.join(",") : targetKey;
  useEffect(() => {
    sim.registerTarget(targetKey, ref, { rounded });
    return () => sim.unregisterTarget(targetKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyDep, rounded, sim]);

  return (
    <View ref={ref} collapsable={false} className={className} style={style}>
      {children}
    </View>
  );
}
