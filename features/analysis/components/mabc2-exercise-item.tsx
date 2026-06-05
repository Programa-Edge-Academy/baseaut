import { colors } from "@/assets/colors";
import React from "react";
import { Text, TextInput, View } from "react-native";

export type Mabc2ExerciseItemProps = {
  id?: string;
  name: string;
  unit: string;
  attemptCount: number | string | null;
  score: number | string | null;
  onChangeAttemptCount?: (value: string) => void;
  onChangeScore?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

export function Mabc2ExerciseItem({
  name,
  unit,
  attemptCount,
  score,
  onChangeAttemptCount,
  onChangeScore,
  readOnly = false,
  className,
  testID,
  accessibilityLabel,
}: Mabc2ExerciseItemProps) {
  const displayAttemptCount =
    attemptCount !== null && attemptCount !== "" ? String(attemptCount) : "-";

  const displayScore = score !== null && score !== "" ? String(score) : "-";

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? name}
      className={`w-full rounded-xl border border-outline bg-level1 px-3 py-2 ${className ?? ""}`}
    >
      <Text
        className="mb-0.5 text-sm font-medium text-white"
        numberOfLines={2}
      >
        {name}
      </Text>

      <Text className="mb-2 text-xs font-medium text-muted">{unit}</Text>

      <View className="flex-row items-center gap-2.5">
        <View className="min-w-[60px] items-center justify-center rounded-xl border border-outline bg-level2 px-4 py-1">
          {readOnly ? (
            <Text className="text-sm font-medium text-white">
              {displayAttemptCount}
            </Text>
          ) : (
            <TextInput
              testID={testID ? `${testID}-attempt-count-input` : undefined}
              accessibilityLabel={`Tentativas de ${name}`}
              className="m-0 w-full p-0 text-center text-sm font-medium text-white"
              value={attemptCount !== null ? String(attemptCount) : ""}
              onChangeText={onChangeAttemptCount}
              keyboardType="numeric"
              placeholder="-"
              placeholderTextColor={colors.muted}
            />
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-medium text-muted">Score:</Text>
          {readOnly ? (
            <Text className="text-white">{displayScore}</Text>
          ) : (
            <View className="min-w-[60px] items-center justify-center rounded-xl border border-outline bg-level2 px-4 py-1">
              <TextInput
                testID={testID ? `${testID}-score-input` : undefined}
                accessibilityLabel={`Score de ${name}`}
                className="m-0 w-full p-0 text-center text-sm font-medium text-white"
                value={score !== null ? String(score) : ""}
                onChangeText={onChangeScore}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor={colors.muted}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}