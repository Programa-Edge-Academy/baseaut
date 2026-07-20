import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

/** Target rectangle in the guard's own coordinate space. */
type GuardRect = { x: number; y: number; width: number; height: number };

/** Extra slack (px) around the target so taps on its edge still go through. */
const HOLE_PADDING = 8;

/** How far a touch may travel before it counts as a scroll and not a tap. */
const TAP_SLOP = 12;

/**
 * Spotlight key the "Em tutorial" header button registers under so the tap guard
 * always lets it through — it is the user's escape hatch out of the tutorial and
 * must stay tappable on every step.
 */
export const TUTORIAL_EXIT_SPOTLIGHT_KEY = "__tutorialExit__";

/**
 * Wraps a screen (or the whole navigator, during a route-spanning simulation) so
 * that, while a guided tutorial is running, only the highlighted target reacts to
 * taps. Every other tap is swallowed, keeping the user on the guided path.
 *
 * @remarks
 * It is mounted as an *ancestor* of the content (like {@link SwipeNavigator}) and
 * uses a React Native Gesture Handler `Tap` gesture, so:
 *  - a genuine tap outside the current target activates the gesture, which cancels
 *    the touch on the descendant that was tapped (nothing happens);
 *  - a tap inside the target rect fails the gesture, so the target receives it;
 *  - a drag never activates a tap gesture, so vertical page scrolling and
 *    horizontal chart scrolling keep working underneath.
 *
 * It fails open: when no target is measured yet (or outside a simulation) it lets
 * every touch through, so it can never trap the user. The active target rect is
 * re-measured on a short interval to follow layout/scroll changes.
 */
export function TutorialTapGuard({ children }: { children: React.ReactNode }) {
  const { active, currentKey, getTarget } = useTutorialSimulation();
  const containerRef = useRef<View>(null);
  const targetRect = useSharedValue<GuardRect | null>(null);
  const exitRect = useSharedValue<GuardRect | null>(null);

  useEffect(() => {
    if (!active) {
      targetRect.value = null;
      exitRect.value = null;
      return;
    }
    let cancelled = false;

    const measureInto = (
      key: string | null,
      into: typeof targetRect,
    ) => {
      const node = key ? getTarget(key)?.ref.current : undefined;
      const container = containerRef.current;
      if (
        !node ||
        typeof node.measureInWindow !== "function" ||
        !container ||
        typeof container.measureInWindow !== "function"
      ) {
        if (!cancelled) into.value = null;
        return;
      }
      // Position the target relative to the guard container so any window
      // offset (status bar, modal origin) cancels out — matching the spotlight.
      container.measureInWindow((ox, oy) => {
        if (cancelled) return;
        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          into.value =
            width > 0 && height > 0
              ? { x: x - ox, y: y - oy, width, height }
              : null;
        });
      });
    };

    const measure = () => {
      measureInto(currentKey, targetRect);
      // The tutorial-exit button stays tappable on every step.
      measureInto(TUTORIAL_EXIT_SPOTLIGHT_KEY, exitRect);
    };

    measure();
    const id = setInterval(measure, 200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active, currentKey, getTarget, targetRect, exitRect]);

  // On web (no gesture-handler root) or outside a simulation, pass through.
  if (Platform.OS === "web" || !active) {
    return <>{children}</>;
  }

  // A Tap gesture only recognizes a near-stationary press (`maxDistance`), so a
  // scroll drag never activates it and the underlying scroll view keeps working.
  const tap = Gesture.Tap()
    .maxDuration(60000)
    .maxDistance(TAP_SLOP)
    .onTouchesDown((event, manager) => {
      "worklet";
      const touch = event.allTouches[0];
      const rect = targetRect.value;
      const exit = exitRect.value;
      // No measured target → don't block anything (fail open).
      if (!touch || (!rect && !exit)) {
        manager.fail();
        return;
      }
      const hits = (r: GuardRect | null) =>
        !!r &&
        touch.x >= r.x - HOLE_PADDING &&
        touch.x <= r.x + r.width + HOLE_PADDING &&
        touch.y >= r.y - HOLE_PADDING &&
        touch.y <= r.y + r.height + HOLE_PADDING;
      // Inside the highlight (or the always-open exit button) → let the target
      // handle its own tap; otherwise the gesture recognizes on release and
      // cancels the tapped descendant.
      if (hits(rect) || hits(exit)) manager.fail();
    });

  return (
    <GestureDetector gesture={tap}>
      <View ref={containerRef} collapsable={false} style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
}
