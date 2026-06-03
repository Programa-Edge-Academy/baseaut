import { colors } from "@/assets/colors";
import React from "react";
import { Text, TextInput, View } from "react-native";

export type Mabc2ExerciseItemProps = {
  name: string;
  unit: string;
  attemptCount: number | string | null;
  score: number | string | null;
  onChangeAttemptCount?: (value: string) => void;
  readOnly?: boolean;
};

export function Mabc2ExerciseItem({
  name,
  unit,
  attemptCount,
  score,
  onChangeAttemptCount,
  readOnly = false,
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
        <View className="rounded-xl border border-outline bg-level2 px-4 py-1 min-w-[60px] justify-center items-center">
          {readOnly ? (
            <Text className="text-sm font-medium text-white">
              {attemptCount !== null && attemptCount !== "" ? String(attemptCount) : "-"}
            </Text>
          ) : (
            <TextInput
              className="text-sm font-medium text-white p-0 m-0 text-center w-full"
              value={attemptCount !== null ? String(attemptCount) : ""}
              onChangeText={onChangeAttemptCount}
              keyboardType="numeric"
              placeholder="-"
              placeholderTextColor={colors.muted}
            />
          )}
        </View>

        <View className="flex-row items-center">
          <Text className="text-sm font-medium text-muted mr-2">Score:</Text>
          <Text className="text-white">
            {score !== null && score !== "" ? String(score) : "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}