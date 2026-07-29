import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import React from "react";
import { Text, TextInput, View } from "react-native";
import {
  Mabc2ExerciseItem,
  Mabc2ExerciseItemProps,
} from "./mabc2-exercise-item";
import type { Mabc2ViewFilter } from "./mabc2-motor-development-card";

/** Props for {@link Mabc2Section}. */
export type Mabc2SectionProps = {
  id?: string;
  title: string;
  categoryScore: number | null;
  categoryPercentile: string | null;
  onChangeCategoryScore?: (value: string) => void;
  onChangeCategoryPercentile?: (value: string) => void;
  exercises: Mabc2ExerciseItemProps[];
  viewMode?: Mabc2ViewFilter;
  readOnly?: boolean;
  showErrors?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * One MABC-2 section: its category score/percentile inputs and the list of
 * exercise items, with view-mode filtering and read-only support.
 */
export function Mabc2Section({
  title,
  categoryScore,
  categoryPercentile,
  onChangeCategoryScore,
  onChangeCategoryPercentile,
  exercises,
  viewMode = null,
  readOnly = false,
  showErrors = false,
  className,
  testID,
  accessibilityLabel,
}: Mabc2SectionProps) {
  const { t } = useI18n();
  const showAll = viewMode === null;
  const showRecords = showAll || viewMode === "records";
  const showExercises = showAll || viewMode === "exercises";

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? title}
      className={className}
    >
      <Text className="mb-2 text-base font-medium text-content">{title}</Text>

      {showRecords ? (
        <View className="mb-3 flex-row gap-3">
          <View
            className={`flex-1 rounded-xl border ${
              showErrors && (categoryScore === null || categoryScore as any === "")
                ? "border-error"
                : "border-outline"
            } bg-level1 px-3 py-1.5`}
          >
            <Text className="text-xs font-medium text-muted">{t("analysis.mabc.score")}</Text>
            {readOnly ? (
              <Text className="text-base font-bold text-content">
                {categoryScore !== null ? String(categoryScore) : "—"}
              </Text>
            ) : (
              <TextInput
                testID={testID ? `${testID}-category-score-input` : undefined}
                className="m-0 p-0 text-base font-bold text-content"
                value={categoryScore !== null ? String(categoryScore) : ""}
                onChangeText={onChangeCategoryScore}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={colors.muted}
              />
            )}
          </View>

          <View
            className={`flex-1 rounded-xl border ${
              showErrors && (categoryPercentile === null || categoryPercentile === "")
                ? "border-error"
                : "border-outline"
            } bg-level1 px-3 py-1.5`}
          >
            <Text className="text-xs font-medium text-muted">{t("analysis.mabc.percentile")}</Text>
            {readOnly ? (
              <Text className="text-base font-bold text-content">
                {categoryPercentile ?? "—"}
              </Text>
            ) : (
              <TextInput
                testID={testID ? `${testID}-category-percentile-input` : undefined}
                className="m-0 p-0 text-base font-bold text-content"
                value={categoryPercentile !== null ? String(categoryPercentile) : ""}
                onChangeText={onChangeCategoryPercentile}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={colors.muted}
              />
            )}
          </View>
        </View>
      ) : null}

      {showExercises ? (
        <View className="gap-2">
          {exercises.map((exercise, index) => (
            <Mabc2ExerciseItem
              key={exercise.id ?? `${exercise.name}-${index}`}
              {...exercise}
              readOnly={exercise.readOnly ?? readOnly}
              showErrors={showErrors}
              testID={
                exercise.testID ??
                (testID ? `${testID}-exercise-${index}` : undefined)
              }
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}