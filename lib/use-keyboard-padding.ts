import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Tracks the software keyboard height so scrollable content can grow its
 * bottom padding by the same amount and the focused input can always be
 * scrolled into view.
 *
 * @remarks
 * With Android edge-to-edge enabled the window is not resized when the
 * keyboard opens, so without this compensation inputs near the bottom of a
 * screen stay covered while typing.
 *
 * @returns The current keyboard height in pixels (0 while hidden).
 */
export function useKeyboardPadding(): number {
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setPadding(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setPadding(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return padding;
}
