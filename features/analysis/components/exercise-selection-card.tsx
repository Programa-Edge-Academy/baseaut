import { colors } from "@/assets/colors";
import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

const OPTIONS = [
  "Todos",
  "Escalada",
  "Girar bambolê",
  "Equilíbrio na tábua",
  "Pular obstáculos",
];

export type ExerciseSelectionCardProps = {
  onSelect?: (index: number) => void;
  className?: string;
};

const SIDE_MARGIN = 16;
const BORDER_RADIUS = 12;
const PADDING_HORIZONTAL = 16;
const PADDING_VERTICAL = 10;
const OPTION_HEIGHT = 44;
const OPTION_GAP = 8;

export function ExerciseSelectionCard({ onSelect, className }: ExerciseSelectionCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = OPTIONS[selectedIndex];
  const width = Math.max(0, windowWidth - SIDE_MARGIN * 2);

  return (
    <View
      className={className ?? ""}
      style={{
        width,
        borderRadius: 0,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "transparent",
        marginHorizontal: SIDE_MARGIN,
      }}
    >
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        className="flex-row items-center justify-between"
        style={{
          backgroundColor: colors.level1,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingVertical: PADDING_VERTICAL,
          borderBottomWidth: 0,
          borderBottomColor: colors.outline,
          borderTopLeftRadius: BORDER_RADIUS,
          borderTopRightRadius: BORDER_RADIUS,
        }}
      >
        <Text className="text-white text-[14px] font-normal">Exercício: {selectedOption}</Text>
        <ChevronDown
          size={24}
          color={colors.muted}
        />
      </Pressable>

      {isOpen ? (
        <View style={{ paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: 10, backgroundColor: colors.level2 }}>
          {OPTIONS.map((exercise, index) => {
            const isSelected = index === selectedIndex;

            return (
              <Pressable
                key={exercise}
                onPress={() => {
                  setSelectedIndex(index);
                  onSelect?.(index);
                  setIsOpen(false); // Optional: close dropdown after selection
                }}
                style={{
                  marginBottom: 0,
                  minHeight: OPTION_HEIGHT,
                  justifyContent: "center",
                  paddingHorizontal: 0,
                  borderRadius: 0,
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.level2,
                  borderWidth: 1,
                  borderColor: "transparent",
                }}
              >
                <View className="flex-row items-center">
                  {isSelected ? (
                    <Check
                      size={20}
                      color="#FFFFFF"
                      strokeWidth={2}
                      style={{ marginRight: 12 }}
                    />
                  ) : (
                    <View style={{ width: 24, marginRight: 12 }} />
                  )}

                  <Text
                    className="text-[14px] font-medium"
                    style={{
                      color: isSelected
                        ? "#FFFFFF"
                        : "#e2e8f0",
                    }}
                  >
                    {exercise}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default ExerciseSelectionCard;
