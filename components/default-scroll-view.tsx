import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

/** Props for {@link DefaultScrollView}. */
export interface DefaultScrollViewProps extends ScrollViewProps {
  className?: string;
  /** Hides the scroll indicators when true. Defaults to true. */
  hideScrollbar?: boolean;
}

/**
 * {@link ScrollView} wrapper that hides scroll indicators by default and uses
 * the app's white indicator style.
 */
export function DefaultScrollView({
  children, 
  className, 
  hideScrollbar = true, 
  ...rest 
}: DefaultScrollViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={!hideScrollbar}
      showsHorizontalScrollIndicator={!hideScrollbar}
      indicatorStyle="white"
      className={className}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}