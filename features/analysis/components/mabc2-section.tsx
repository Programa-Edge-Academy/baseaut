import React from "react";
import { Text, View } from "react-native";
import {
    Mabc2ExerciseItem,
    Mabc2ExerciseItemProps,
} from "./mabc2-exercise-item";

export type Mabc2SectionProps = {
  id?: string;
  title: string;
  categoryScore: number | null;
  categoryPercentile: string | null;
  exercises: Mabc2ExerciseItemProps[];
  readOnly?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

export function Mabc2Section({
  title,
  categoryScore,
  categoryPercentile,
  exercises,
  readOnly = false,
  className,
  testID,
  accessibilityLabel,
}: Mabc2SectionProps) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? title}
      className={className}
    >
      <Text className="mb-2 text-base font-medium text-white">{title}</Text>

      <View className="mb-3 flex-row gap-3">
        <View className="flex-1 rounded-xl border border-outline bg-level1 px-3 py-1.5">
          <Text className="text-xs font-medium text-muted">Pontuação</Text>
          <Text className="text-base font-bold text-white">
            {categoryScore !== null ? String(categoryScore) : "—"}
          </Text>
        </View>

        <View className="flex-1 rounded-xl border border-outline bg-level1 px-3 py-1.5">
          <Text className="text-xs font-medium text-muted">Percentil</Text>
          <Text className="text-base font-bold text-white">
            {categoryPercentile ?? "—"}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        {exercises.map((exercise, index) => (
          <Mabc2ExerciseItem
            key={exercise.id ?? `${exercise.name}-${index}`}
            {...exercise}
            readOnly={exercise.readOnly ?? readOnly}
            testID={
              exercise.testID ??
              (testID ? `${testID}-exercise-${index}` : undefined)
            }
          />
        ))}
      </View>
    </View>
  );
}