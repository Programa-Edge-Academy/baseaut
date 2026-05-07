import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

export interface DefaultScrollViewProps extends ScrollViewProps {
  className?: string;
  hideScrollbar?: boolean;
}

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