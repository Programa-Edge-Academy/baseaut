import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

/** Props for {@link ExerciseSelectionCard}. */
export type ExerciseSelectionCardProps = {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
};

const BORDER_RADIUS = 12;
const PADDING_HORIZONTAL = 16;
const PADDING_VERTICAL = 10;
const OPTION_HEIGHT = 44;

/** Dropdown selector for filtering analysis views by a single exercise (or all). */
export function ExerciseSelectionCard({
  options,
  selectedIndex = 0,
  onSelect,
  className,
}: ExerciseSelectionCardProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const displayOptions = Array.isArray(options) && options.length > 0 ? options : [t("common.allM")];
  
  const safeSelectedIndex = selectedIndex >= 0 && selectedIndex < displayOptions.length ? selectedIndex : 0;
  const selectedOption = displayOptions[safeSelectedIndex];

  return (
    <View className={`w-full ${className ?? ""}`} style={{ backgroundColor: "transparent" }}>
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
        <Text numberOfLines={1} className="flex-1 text-content text-[14px] font-normal">
          {t("analysis.compare.exercise")}: {selectedOption}
        </Text>
        <ChevronDown size={24} color={colors.muted} />
      </Pressable>

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
          {displayOptions.map((exercise, index) => {
            const isSelected = index === safeSelectedIndex;

            return (
              <Pressable
                key={`${exercise}-${index}`}
                onPress={() => {
                  onSelect(index);
                  setIsOpen(false);
                }}
                style={{
                  minHeight: OPTION_HEIGHT,
                  justifyContent: "center",
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected ? colors.primary : colors.level2,
                }}
              >
                <View className="flex-row items-center flex-1">
                  {isSelected ? (
                    <Check size={20} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 12 }} />
                  ) : (
                    <View style={{ width: 20, marginRight: 12 }} />
                  )}

                  <Text
                    numberOfLines={1}
                    className="flex-1 text-[14px] font-medium"
                    style={{ color: isSelected ? "#FFFFFF" : "#E2E8F0" }}
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