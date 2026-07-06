import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

/** Measured highlight rectangle in window coordinates. */
type SpotlightRect = { x: number; y: number; width: number; height: number; rounded: boolean };

/**
 * Blinking white highlight that overlays the current simulation sub-step's
 * target. Render one inside every surface that can hold a target (the screen
 * and each modal); it measures the active target in window coordinates and
 * draws the rectangle there, so it lines up regardless of which surface it lives
 * in. It is `pointerEvents="none"`, so touches still reach the highlighted
 * element, and can therefore sit above modal content.
 */
export function TutorialSpotlight() {
  const { currentKey, getTarget } = useTutorialSimulation();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!currentKey) {
      setRect(null);
      return;
    }
    let cancelled = false;

    const measure = () => {
      const target = getTarget(currentKey);
      const node = target?.ref.current;
      if (!node || typeof node.measureInWindow !== "function") {
        if (!cancelled) setRect(null);
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        if (cancelled) return;
        setRect(
          width > 0 && height > 0
            ? { x, y, width, height, rounded: target!.rounded }
            : null,
        );
      });
    };

    measure();
    const id = setInterval(measure, 250);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [currentKey, getTarget]);

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

  if (!rect) return null;

  const pad = 6;
  return (
    <View pointerEvents="none" className="absolute inset-0">
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
    </View>
  );
}
