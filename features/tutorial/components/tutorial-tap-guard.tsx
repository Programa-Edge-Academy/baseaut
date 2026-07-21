import {
  GuardScopeProvider,
  useGuardScope,
} from "@/features/tutorial/contexts/guard-scope-context";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect, useId, useRef, useState } from "react";
import { Platform, View } from "react-native";

/** Rectangle in the guard container's own coordinate space. */
type GuardRect = { x: number; y: number; width: number; height: number };

/** Extra slack (px) around an open area so taps on its edge still go through. */
const HOLE_PADDING = 8;

/** How often the open areas are re-measured, to follow layout and scrolling. */
const MEASURE_INTERVAL_MS = 200;

/**
 * Spotlight key the "Em tutorial" header button registers under so the tap guard
 * always lets it through — it is the user's escape hatch out of the tutorial and
 * must stay tappable on every step.
 */
export const TUTORIAL_EXIT_SPOTLIGHT_KEY = "__tutorialExit__";

/** Returns whether two rect lists are equal, to avoid pointless re-renders. */
function sameRects(a: GuardRect[], b: GuardRect[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((r, i) => {
    const o = b[i];
    return (
      Math.abs(r.x - o.x) < 1 &&
      Math.abs(r.y - o.y) < 1 &&
      Math.abs(r.width - o.width) < 1 &&
      Math.abs(r.height - o.height) < 1
    );
  });
}

/**
 * Subtracts a hole from a rectangle, returning the (up to four) rectangles that
 * cover what is left. Rectangles that do not intersect come back unchanged.
 */
function subtractHole(rect: GuardRect, hole: GuardRect): GuardRect[] {
  const left = Math.max(rect.x, hole.x);
  const right = Math.min(rect.x + rect.width, hole.x + hole.width);
  const top = Math.max(rect.y, hole.y);
  const bottom = Math.min(rect.y + rect.height, hole.y + hole.height);

  // No overlap: nothing to cut out.
  if (left >= right || top >= bottom) return [rect];

  const pieces: GuardRect[] = [];
  if (top > rect.y) {
    pieces.push({ x: rect.x, y: rect.y, width: rect.width, height: top - rect.y });
  }
  if (bottom < rect.y + rect.height) {
    pieces.push({
      x: rect.x,
      y: bottom,
      width: rect.width,
      height: rect.y + rect.height - bottom,
    });
  }
  if (left > rect.x) {
    pieces.push({ x: rect.x, y: top, width: left - rect.x, height: bottom - top });
  }
  if (right < rect.x + rect.width) {
    pieces.push({
      x: right,
      y: top,
      width: rect.x + rect.width - right,
      height: bottom - top,
    });
  }
  return pieces;
}

/**
 * Wraps a screen (or the whole navigator, during a route-spanning simulation) so
 * that, while a guided tutorial is running, only the open areas react to touches.
 * Everything else is covered by blocking panels, keeping the user on the guided
 * path.
 *
 * The open areas are the current sub-step's target, the tutorial exit button,
 * and any registered passthrough area (form inputs).
 *
 * @remarks
 * Only the *current* target opens, never the one before it. A screen the user
 * navigated away from stays mounted underneath, so the previous target still
 * measures to valid coordinates and would punch a hole at that position on the
 * new screen — which let the session tutorial's "Iniciar atividade" be pressed
 * ahead of time, because it sits where the circuit card sat. Repeat interactions
 * (ending a crisis, resuming a paused timer) do not depend on this: the
 * simulations model each one as its own sub-step bound to the same control.
 *
 * Blocking happens by covering the rest of the surface with sibling views that
 * claim the touch responder on press, rather than by arbitrating a gesture over
 * the content. A `Tap` gesture only resolves when the finger lifts, by which
 * point React Native has already delivered `onPress` to the pressable
 * underneath, so it loses the race and nothing is actually blocked; a covering
 * view wins at touch-down because the touch never reaches the element below.
 *
 * The panels grant `onResponderTerminationRequest`, so a scroll view underneath
 * can still take the touch over when the user drags. Taps are blocked, scrolling
 * is untouched, and the user can always reach an off-screen target.
 *
 * It fails open: with no measured open area it renders no panels at all, so it
 * can never trap the user. Because a React Native `Modal` renders in its own
 * native hierarchy, panels mounted here do not cover modal content — every modal
 * mounts its own guard through {@link file://../../../components/app-modal.tsx}.
 */
export function TutorialTapGuard({ children }: { children: React.ReactNode }) {
  const { active, currentKey, getTarget, getPassthroughs } =
    useTutorialSimulation();
  const containerRef = useRef<View>(null);
  const [panels, setPanels] = useState<GuardRect[]>([]);
  // Each guard owns a surface. Nesting one inside another (a modal over a
  // screen) gives the inner content its own identity.
  const parentScope = useGuardScope();
  const ownScope = useId();
  const scope = active ? ownScope : parentScope;

  useEffect(() => {
    if (!active) {
      setPanels([]);
      return;
    }
    let cancelled = false;

    /** Measures a node relative to the guard container. */
    const measure = (node: View | null | undefined): Promise<GuardRect | null> =>
      new Promise((resolve) => {
        const container = containerRef.current;
        if (
          !node ||
          typeof node.measureInWindow !== "function" ||
          !container ||
          typeof container.measureInWindow !== "function"
        ) {
          resolve(null);
          return;
        }
        // Measure both in window coordinates and take the difference, so any
        // offset of the guard itself (status bar, modal origin) cancels out.
        container.measureInWindow((ox, oy) => {
          node.measureInWindow((x, y, width, height) => {
            resolve(
              width > 0 && height > 0
                ? { x: x - ox, y: y - oy, width, height }
                : null,
            );
          });
        });
      });

    /** Clears every panel, leaving the surface fully interactive. */
    const failOpen = () => setPanels((prev) => (prev.length ? [] : prev));

    const refresh = async () => {
      const container = containerRef.current;
      if (!container) return;

      // Block only what this surface owns. A target registered elsewhere — on
      // the screen behind this modal — still measures to valid coordinates, so
      // without the scope check a modal holding no target would block itself.
      const target = currentKey ? getTarget(currentKey) : undefined;
      if (!target || target.scope !== scope) {
        failOpen();
        return;
      }

      // Block only while the current target can actually be pointed at. If it
      // is not measurable the spotlight has nothing to draw either, so blocking
      // would leave the user with no lit control and no way forward.
      const currentRect = await measure(target.ref.current);
      if (cancelled) return;
      if (!currentRect) {
        failOpen();
        return;
      }

      const exit = getTarget(TUTORIAL_EXIT_SPOTLIGHT_KEY);
      const openNodes: (View | null | undefined)[] = [
        exit?.scope === scope ? exit.ref.current : null,
        ...getPassthroughs(scope).map((ref) => ref.current),
      ];

      const holes = [
        currentRect,
        ...(await Promise.all(openNodes.map(measure))),
      ].filter((r): r is GuardRect => r !== null);

      if (cancelled) return;

      const size = await new Promise<GuardRect | null>((resolve) => {
        container.measureInWindow((_x, _y, width, height) =>
          resolve(width > 0 && height > 0 ? { x: 0, y: 0, width, height } : null),
        );
      });
      if (cancelled || !size) return;

      const next = holes.reduce<GuardRect[]>(
        (rects, hole) =>
          rects.flatMap((rect) =>
            subtractHole(rect, {
              x: hole.x - HOLE_PADDING,
              y: hole.y - HOLE_PADDING,
              width: hole.width + HOLE_PADDING * 2,
              height: hole.height + HOLE_PADDING * 2,
            }),
          ),
        [size],
      );

      setPanels((prev) => (sameRects(prev, next) ? prev : next));
    };

    refresh();
    const id = setInterval(refresh, MEASURE_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active, currentKey, getTarget, getPassthroughs, scope]);

  // On web the guard is inert; the tutorial is a touch-first experience there.
  if (Platform.OS === "web" || !active) {
    return <>{children}</>;
  }

  return (
    <View ref={containerRef} collapsable={false} style={{ flex: 1 }}>
      <GuardScopeProvider value={scope}>{children}</GuardScopeProvider>
      {panels.map((rect, i) => (
        <View
          key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}-${i}`}
          // Claiming the responder on touch-down keeps the press from ever
          // reaching the element below; granting termination lets a scroll view
          // take the touch over, so dragging still scrolls the page.
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => true}
          style={{
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}
    </View>
  );
}
