import { RefObject, useEffect, useRef } from "react";
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  TextInput,
} from "react-native";

/** Props to spread onto a {@link ScrollView} to make it keyboard-aware. */
export interface KeyboardAwareScroll {
  /** Ref that must be attached to the scrollable {@link ScrollView}. */
  ref: RefObject<ScrollView | null>;
  /** Scroll handler that tracks the current offset. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Throttle for {@link onScroll}. */
  scrollEventThrottle: number;
}

/**
 * Keeps the focused input above the software keyboard by measuring it in window
 * coordinates and scrolling the attached {@link ScrollView} so the input clears
 * the keyboard top.
 *
 * @remarks
 * This measure-and-scroll approach works on the new architecture (Fabric),
 * unlike the legacy scroll-responder helpers. Attach the returned props to the
 * {@link ScrollView} that owns the scrolling; it must not be nested inside
 * another vertical `ScrollView`. Pair it with bottom padding equal to the
 * keyboard height (see {@link useKeyboardPadding}) so there is room to scroll.
 *
 * @returns Props (`ref`, `onScroll`, `scrollEventThrottle`) to spread on the
 * `ScrollView`.
 */
export function useKeyboardAwareScroll(): KeyboardAwareScroll {
  const ref = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", (event) => {
      const keyboardTop = event.endCoordinates.screenY;
      const focused = (TextInput.State as any).currentlyFocusedInput?.();
      if (!focused || typeof focused.measureInWindow !== "function") return;

      focused.measureInWindow(
        (_x: number, y: number, _w: number, height: number) => {
          // Reveal the whole field above the keyboard, with a comfortable gap.
          // Guard against focused nodes that report only their caret-line
          // height so the full input clears the keyboard, not just its top.
          const margin = 28;
          const inputHeight = Math.max(height, 48);
          const overlap = y + inputHeight + margin - keyboardTop;
          if (overlap > 0) {
            ref.current?.scrollTo({
              y: scrollYRef.current + overlap,
              animated: true,
            });
          }
        },
      );
    });
    return () => sub.remove();
  }, []);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  };

  return { ref, onScroll, scrollEventThrottle: 16 };
}
