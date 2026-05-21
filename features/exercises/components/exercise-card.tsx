import { colors } from "@/assets/colors";
import { Dumbbell, MoreVertical } from "lucide-react-native";
import React, { useRef } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Layout coordinates for placing an options menu.
 */
export type OptionsLayout = { top: number; left: number; width: number };

/**
 * Props for the exercise card component.
 */
interface ExerciseCardProps {
  name: string;
  description?: string;
  duration: string;
  tags: string;
  onPressOptions?: (layout: OptionsLayout) => void;
  className?: string;
}

/**
 * Displays a summary card for an exercise.
 */
export function ExerciseCard({
  name,
  description,
  duration,
  tags,
  onPressOptions,
  className,
}: ExerciseCardProps) {
  const optionsButtonRef = useRef<View>(null);

  /**
   * Measures the options button and emits its layout.
   */
  const handlePressOptions = () => {
    if (!onPressOptions) return;
    optionsButtonRef.current?.measureInWindow((x, y, width, height) => {
      onPressOptions({ top: y + height, left: x, width });
    });
  };
  return (
    <View
      className={`w-full flex-row items-center gap-4 rounded-[20px] bg-level1 p-4 ${className ?? ""} border border-outline`}
    >
      {/* Ícone de Exercício */}
      <View
        style={{ backgroundColor: colors.secondary + "15" }}
        className="h-16 w-16 items-center justify-center rounded-[20px]"
      >
        <Dumbbell size={28} color={colors.secondary} />
      </View>

      {/* Conteúdo de Texto */}
      <View className="flex-1 justify-center">
        <Text className="text-[18px] font-bold text-white" numberOfLines={1}>
          {name}
        </Text>

        {description ? (
          <Text
            className="mt-1 text-[14px] leading-5 text-muted"
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}

        {/* Metadados (Tempo e Tags) */}
        <View className="mt-2 flex-row items-center">
          <Text className="text-[12px] text-muted">
            • {duration} • {tags}
          </Text>
        </View>
      </View>

      {/* Botão de Opções */}
      <View ref={optionsButtonRef} collapsable={false}>
        <Pressable
          onPress={handlePressOptions}
          className="h-10 w-6 items-center justify-center active:opacity-60"
        >
          <MoreVertical size={25} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}
