import React, { forwardRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

/** Props for {@link DefaultScrollView}. */
export interface DefaultScrollViewProps extends ScrollViewProps {
  className?: string;
  /** Hides the scroll indicators when true. Defaults to true. */
  hideScrollbar?: boolean;
}

/**
 * {@link ScrollView} wrapper that hides scroll indicators by default and uses
 * the app's white indicator style. Forwards its ref to the underlying
 * `ScrollView` so callers can drive it (e.g. keyboard-aware scrolling).
 */
export const DefaultScrollView = forwardRef<ScrollView, DefaultScrollViewProps>(
  function DefaultScrollView(
    { children, className, hideScrollbar = true, ...rest },
    ref,
  ) {
    return (
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={!hideScrollbar}
        showsHorizontalScrollIndicator={!hideScrollbar}
        indicatorStyle="white"
        className={className}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  },
);
