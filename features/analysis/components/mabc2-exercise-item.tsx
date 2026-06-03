/* features/analysis/components/mabc2-exercise-item.tsx*/

import React from "react";
import { Text, View } from "react-native";

export type Mabc2ExerciseItemProps = {
  name: string;
  unit: string;
  attemptCount: number;
  score: number | null;
};

export function Mabc2ExerciseItem({
  name,
  unit,
  attemptCount,
  score,
}: Mabc2ExerciseItemProps) {
  return (
    <View className="w-full rounded-xl border border-outline bg-level1 px-3 py-2">
      <Text
        className="text-sm font-medium text-white mb-0.5"
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text className="text-xs font-medium text-muted mb-2">{unit}</Text>

      <View className="flex-row items-center gap-2.5">
        <View className="rounded-xl border border-outline bg-level2 px-4 py-1">
          <Text className="text-sm font-medium text-white">{attemptCount}</Text>
        </View>

        <Text className="text-sm font-medium text-muted">
          Score:{" "}
          <Text className="text-white">
            {score !== null ? String(score) : "-"}
          </Text>
        </Text>
      </View>
    </View>
  );
}