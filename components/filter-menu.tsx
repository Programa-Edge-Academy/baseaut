import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import React from "react";
import { Text, View } from "react-native";
import { RipplePressable } from "./ripple-pressable";

export type FilterOption = {
  id: string;
  label: string;
};

export type FilterMenuProps = {
  options: FilterOption[];
  selectedIds: string[];
  onSelect: (selectedIds: string[]) => void;
  mode?: "single" | "multiple" | "multiple-with-all";
};

export function FilterMenu({
  options,
  selectedIds,
  onSelect,
  mode = "single",
}: FilterMenuProps) {
  const handlePress = (id: string) => {
    if (mode === "single") {
      onSelect([id]);
      return;
    }

    if (mode === "multiple-with-all") {
      const firstOptionId = options[0]?.id;

      if (id === firstOptionId) {
        onSelect([firstOptionId]);
      } else {
        if (selectedIds.includes(id)) {
          const nextIds = selectedIds.filter((selectedId) => selectedId !== id);
          
          if (nextIds.length === 0) {
            onSelect([firstOptionId]);
          } else {
            onSelect(nextIds);
          }
        } else {
          const nextIds = selectedIds.filter((selectedId) => selectedId !== firstOptionId);
          onSelect([...nextIds, id]);
        }
      }
      return;
    }

    if (mode === "multiple") {
      if (selectedIds.includes(id)) {
        if (selectedIds.length === 1) return;
        onSelect(selectedIds.filter((selectedId) => selectedId !== id));
      } else {
        onSelect([...selectedIds, id]);
      }
    }
  };

  return (
    <View className="absolute right-0 top-12 z-50 inline-flex flex-col items-center justify-start gap-[5px] rounded-2xl border border-outline bg-level2 p-2.5 shadow-base">
      {options.map((option) => {
        const isActive = selectedIds.includes(option.id);

        return (
          <RipplePressable
            key={option.id}
            onPress={() => handlePress(option.id)}
            rippleColor={withOpacity(colors.primary, 0.1)}
            className="h-7 w-36 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: isActive
                ? withOpacity(colors.primary, 0.1)
                : "transparent",
            }}
          >
            <Text
              className={`text-default-2 ${isActive ? "text-white" : "text-muted"}`}
            >
              {option.label}
            </Text>
          </RipplePressable>
        );
      })}
    </View>
  );
}