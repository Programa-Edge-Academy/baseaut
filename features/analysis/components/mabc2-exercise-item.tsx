import { colors } from "@/assets/colors";
import React from "react";
import { Text, TextInput, View } from "react-native";

/** Props for {@link Mabc2ExerciseItem}. */
export type Mabc2ExerciseItemProps = {
  id?: string;
  name: string;
  unit: string;
  attemptCount: number | string | null;
  score: number | string | null;
  onChangeAttemptCount?: (value: string) => void;
  onChangeScore?: (value: string) => void;
  readOnly?: boolean;
  showErrors?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

/** Maps a measurement unit code to its display label. */
function formatMeasuredUnit(unit: string) {
  if (unit === "tentativas") return "Medido em sucessos";
  if (unit === "seg") return "Medido em segundos";

  return unit;
}

/**
 * Single MABC-2 exercise row with attempt-count and score fields, editable or
 * read-only.
 */
export function Mabc2ExerciseItem({
  name,
  unit,
  attemptCount,
  score,
  onChangeAttemptCount,
  onChangeScore,
  readOnly = false,
  showErrors = false,
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

      <Text className="mb-2 text-xs font-medium text-muted">
        {formatMeasuredUnit(unit)}
      </Text>

      <View className="flex-row items-center gap-2.5">
        <View
          className={`min-w-[60px] items-center justify-center rounded-xl border ${
            showErrors && (attemptCount === null || attemptCount === "")
              ? "border-error"
              : "border-outline"
          } bg-level2 px-4 py-1`}
        >
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
            <View
              className={`min-w-[60px] items-center justify-center rounded-xl border ${
                showErrors && (score === null || score === "")
                  ? "border-error"
                  : "border-outline"
              } bg-level2 px-4 py-1`}
            >
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