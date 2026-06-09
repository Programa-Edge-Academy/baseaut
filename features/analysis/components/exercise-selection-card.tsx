import { colors } from "@/assets/colors";
import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

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

const BORDER_RADIUS = 12;
const PADDING_HORIZONTAL = 16;
const PADDING_VERTICAL = 10;
const OPTION_HEIGHT = 44;

export function ExerciseSelectionCard({
  onSelect,
  className,
}: ExerciseSelectionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = OPTIONS[selectedIndex];

  return (
    <View
      className={`w-full ${className ?? ""}`}
      style={{
        backgroundColor: "transparent",
      }}
    >
      {/* Header */}
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        className="flex-row items-center justify-between"
        style={{
          backgroundColor: colors.level1,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingVertical: PADDING_VERTICAL,
          borderWidth: 1,
          borderColor: colors.outline,
          borderRadius: BORDER_RADIUS,
        }}
      >
        <Text
          numberOfLines={1}
          className="flex-1 text-white text-[14px] font-normal"
        >
          Exercício: {selectedOption}
        </Text>

        <ChevronDown
          size={24}
          color={colors.muted}
        />
      </Pressable>

      {/* Dropdown */}
      {isOpen && (
        <View
          style={{
            marginTop: 4,
            paddingHorizontal: PADDING_HORIZONTAL,
            paddingVertical: 10,
            backgroundColor: colors.level2,
            borderWidth: 1,
            borderColor: colors.outline,
            borderRadius: BORDER_RADIUS,
          }}
        >
          {OPTIONS.map((exercise, index) => {
            const isSelected = index === selectedIndex;

            return (
              <Pressable
                key={exercise}
                onPress={() => {
                  setSelectedIndex(index);
                  onSelect?.(index);
                  setIsOpen(false);
                }}
                style={{
                  minHeight: OPTION_HEIGHT,
                  justifyContent: "center",
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.level2,
                }}
              >
                <View className="flex-row items-center flex-1">
                  {isSelected ? (
                    <Check
                      size={20}
                      color="#FFFFFF"
                      strokeWidth={2}
                      style={{ marginRight: 12 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 20,
                        marginRight: 12,
                      }}
                    />
                  )}

                  <Text
                    numberOfLines={1}
                    className="flex-1 text-[14px] font-medium"
                    style={{
                      color: isSelected
                        ? "#FFFFFF"
                        : "#E2E8F0",
                    }}
                  >
                    {exercise}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default ExerciseSelectionCard;