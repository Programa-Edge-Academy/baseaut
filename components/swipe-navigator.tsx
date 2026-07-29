import React from "react";
import { Platform, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

/** Props for {@link SwipeNavigator}. */
export type SwipeNavigatorProps = {
  children: React.ReactNode;
  /** Called when the user swipes left (e.g. move to the next section). */
  onSwipeLeft?: () => void;
  /** Called when the user swipes right (e.g. move to the previous section). */
  onSwipeRight?: () => void;
};

/** Minimum horizontal travel (px) that counts as a section swipe. */
const SWIPE_THRESHOLD = 70;

/**
 * Wraps a screen so a horizontal swipe navigates between the main sections.
 *
 * @remarks
 * The pan gesture only activates past a horizontal offset, so vertical list
 * scrolling is unaffected. On web (where the gesture-handler root is not set
 * up) it renders its children unchanged.
 */
export function SwipeNavigator({
  children,
  onSwipeLeft,
  onSwipeRight,
}: SwipeNavigatorProps) {
  if (Platform.OS === "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((event) => {
      if (Math.abs(event.translationY) > Math.abs(event.translationX)) return;
      if (event.translationX <= -SWIPE_THRESHOLD && onSwipeLeft) {
        runOnJS(onSwipeLeft)();
      } else if (event.translationX >= SWIPE_THRESHOLD && onSwipeRight) {
        runOnJS(onSwipeRight)();
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }}>{children}</View>
    </GestureDetector>
  );
}
