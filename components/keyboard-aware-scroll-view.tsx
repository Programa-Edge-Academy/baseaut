import { useKeyboardAwareScroll } from "@/lib/use-keyboard-aware-scroll";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import React from "react";
import { ScrollView, ScrollViewProps } from "react-native";

/** Props for {@link KeyboardAwareScrollView}. */
export type KeyboardAwareScrollViewProps = ScrollViewProps & {
  children: React.ReactNode;
};

/**
 * {@link ScrollView} that keeps the focused input visible above the software
 * keyboard: it scrolls the field into view and reserves bottom padding equal to
 * the keyboard height so there is always room to scroll to it.
 *
 * @remarks
 * Use it for any scrollable surface holding text inputs — modals included,
 * which is where the keyboard most often covered what was being typed. It must
 * own the scrolling: nesting it inside another vertical `ScrollView` breaks the
 * measure-and-scroll behaviour, so in that case pass the hooks to the outer one
 * instead ({@link useKeyboardAwareScroll} and {@link useKeyboardPadding}).
 *
 * `keyboardShouldPersistTaps="handled"` is the default so a tap on a button
 * inside the form registers on the first press instead of only dismissing the
 * keyboard.
 */
export function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  ...rest
}: KeyboardAwareScrollViewProps) {
  const keyboardAware = useKeyboardAwareScroll();
  const keyboardPadding = useKeyboardPadding();

  return (
    <ScrollView
      {...keyboardAware}
      {...rest}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: keyboardPadding },
      ]}
    >
      {children}
    </ScrollView>
  );
}
