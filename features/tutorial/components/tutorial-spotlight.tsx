import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

/** Measured highlight rectangle in the overlay container's local coordinates. */
type SpotlightRect = { x: number; y: number; width: number; height: number; rounded: boolean };

/**
 * Blinking white highlight that overlays the current simulation sub-step's
 * target. Render one inside every surface that can hold a target (the screen and
 * each modal); it measures the active target and draws the rectangle over it.
 *
 * @remarks
 * The target and this overlay's own container are both measured with
 * `measureInWindow` and the rectangle is positioned at their difference, so it
 * lines up regardless of where the overlay sits — a screen root offset by the
 * status bar (Android edge-to-edge) or a modal at an arbitrary origin both
 * cancel out.
 *
 * To avoid a duplicated, offset ring when a modal is open (the screen overlay
 * behind it would otherwise also draw the modal's target, but measured across
 * window boundaries), only the topmost mounted overlay draws: each overlay
 * registers on mount, and a modal — which mounts over the screen — becomes the
 * active one until it closes ({@link TutorialSimulationValue.activeSpotlightId}).
 * The overlay is `pointerEvents="none"` and stacks above modal content via a high
 * `zIndex`/`elevation`, so touches still reach the highlighted element while the
 * ring is never hidden behind z-indexed menus.
 */
export function TutorialSpotlight() {
  const {
    currentKey,
    getTarget,
    registerSpotlight,
    unregisterSpotlight,
    activeSpotlightId,
  } = useTutorialSimulation();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const containerRef = useRef<View>(null);
  const idRef = useRef<number | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  // Register this overlay so the topmost one (a modal over the screen) wins.
  useEffect(() => {
    const id = registerSpotlight();
    idRef.current = id;
    return () => unregisterSpotlight(id);
  }, [registerSpotlight, unregisterSpotlight]);

  const isTop = idRef.current !== null && idRef.current === activeSpotlightId;

  useEffect(() => {
    if (!currentKey || !isTop) {
      setRect(null);
      return;
    }
    let cancelled = false;

    const measure = () => {
      const target = getTarget(currentKey);
      const node = target?.ref.current;
      const container = containerRef.current;
      if (
        !node ||
        typeof node.measureInWindow !== "function" ||
        !container ||
        typeof container.measureInWindow !== "function"
      ) {
        if (!cancelled) setRect(null);
        return;
      }
      // Measure the container first, then the target, and position the rectangle
      // relative to the container so any window-coordinate offset cancels out.
      container.measureInWindow((ox, oy) => {
        if (cancelled) return;
        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          setRect(
            width > 0 && height > 0
              ? { x: x - ox, y: y - oy, width, height, rounded: target!.rounded }
              : null,
          );
        });
      });
    };

    measure();
    const id = setInterval(measure, 250);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [currentKey, getTarget, isTop]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  // Only the topmost overlay with an active sub-step renders. The container stays
  // mounted (never gated on the rect) so it can be measured on the first pass.
  if (!currentKey || !isTop) return null;

  const pad = 6;
  return (
    <View
      ref={containerRef}
      pointerEvents="none"
      className="absolute inset-0"
      style={{ zIndex: 9999, elevation: 9999 }}
    >
      {rect && (
        <Animated.View
          style={{
            position: "absolute",
            left: rect.x - pad,
            top: rect.y - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: rect.rounded ? 16 : 0,
            opacity,
          }}
        />
      )}
    </View>
  );
}
