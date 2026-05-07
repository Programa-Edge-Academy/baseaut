import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

export interface DefaultTextInputProps extends TextInputProps {
  className?: string;
}

export function DefaultTextInput({ className, multiline, ...rest }: DefaultTextInputProps) {
  return (
    <TextInput
      multiline={multiline}
      {...rest}
      placeholderTextColor="#465460"
      textAlignVertical={multiline ? "top" : "center"}
      className={`bg-level1 px-3.5 py-3 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline text-white text-default-2 text-left ${className ?? ''}`}
    />
  );
}