import React, { useState } from "react";
import { Text, View } from "react-native";

import { colors } from "../assets/colors";
import { RipplePressable } from "./ripple-pressable";

interface SectionFieldProps {
  firstLabel?: string;
  secondLabel?: string;
  className?: string;
  defaultValue?: string;
}

export function SectionField({
  firstLabel = "Exercícios",
  secondLabel = "Circuitos",
  className,
  defaultValue,
}: SectionFieldProps) {
  const [selectedValue, setSelectedValue] = useState(
    defaultValue ?? firstLabel
  );

  const options = [
    {
      label: firstLabel,
      value: firstLabel,
    },
    {
      label: secondLabel,
      value: secondLabel,
    },
  ];

  return (
    <View
      className={`flex-row items-center justify-around rounded-[15px] overflow-hidden py-1 px-2 ${
        className ?? ""
      }`}
      style={{
        backgroundColor: colors.outline,
      }}
    >
      {options.map((option) => {
        const isSelected =
          option.value === selectedValue;

        return (
          <RipplePressable
            key={option.value}
            className="flex-1 items-center justify-center py-2 px-6 rounded-[10px]"
            style={{
              backgroundColor: isSelected
                ? colors.level2
                : "transparent",
            }}
            onPress={() =>
              setSelectedValue(option.value)
            }
          >
            <Text
              className={`text-center text-base font-bold ${
                isSelected
                  ? "text-white"
                  : "text-muted"
              }`}
            >
              {option.label}
            </Text>
          </RipplePressable>
        );
      })}
    </View>
  );
}