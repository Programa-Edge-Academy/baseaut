import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { ClipboardList, Dumbbell } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Mabc2Section, Mabc2SectionProps } from "./mabc2-section";

/** Which part of a MABC-2 record to show, or null for everything. */
export type Mabc2ViewFilter = "records" | "exercises" | null;

/** Props for {@link Mabc2MotorDevelopmentCard}. */
export type Mabc2MotorDevelopmentCardProps = {
  recordCount: number;
  totalScore: number | null;
  totalPercentile: string | null;
  onChangeTotalScore?: (value: string) => void;
  onChangeTotalPercentile?: (value: string) => void;
  sections: Mabc2SectionProps[];
  onRegister?: () => void;
  readOnly?: boolean;
  showErrors?: boolean;
  submitLabel?: string;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

const SELECTED_BORDER_COLOR = "#0E89E5";
const SELECTED_BACKGROUND_COLOR = "#1A2836";

/**
 * MABC-2 motor development card: total score/percentile inputs plus per-section
 * details, with category/exercise view filters and an optional submit button.
 */
export function Mabc2MotorDevelopmentCard({
  recordCount,
  totalScore,
  totalPercentile,
  onChangeTotalScore,
  onChangeTotalPercentile,
  sections,
  onRegister,
  readOnly = false,
  showErrors = false,
  submitLabel = "Registrar",
  className,
  testID,
  accessibilityLabel = "Desenvolvimento motor",
}: Mabc2MotorDevelopmentCardProps) {
  const [viewFilter, setViewFilter] = useState<Mabc2ViewFilter>(null);

  const isRecordsSelected = viewFilter === "records";
  const isExercisesSelected = viewFilter === "exercises";
  const showAll = viewFilter === null;

  function handleRecordsPress() {
    setViewFilter((current) => (current === "records" ? null : "records"));
  }

  function handleExercisesPress() {
    setViewFilter((current) => (current === "exercises" ? null : "exercises"));
  }

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      className={`w-full gap-4 rounded-xl border border-outline bg-level2 p-4 ${className ?? ""}`}
    >
      <Text className="text-base font-bold text-white">
        Desenvolvimento motor
      </Text>

      <View className="flex-row gap-2.5">
        <Pressable
          testID={testID ? `${testID}-records-button` : undefined}
          accessibilityRole="button"
          accessibilityState={{ selected: isRecordsSelected }}
          accessibilityLabel={`Registros, ${recordCount} encontrados`}
          onPress={handleRecordsPress}
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1 active:opacity-70"
          style={{
            borderWidth: 1,
            borderColor: isRecordsSelected ? SELECTED_BORDER_COLOR : colors.outline,
            backgroundColor: isRecordsSelected ? SELECTED_BACKGROUND_COLOR : colors.level1,
          }}
        >
          <ClipboardList
            size={16}
            color={isRecordsSelected ? SELECTED_BORDER_COLOR : colors.muted}
          />
          <Text
            className="text-sm font-medium"
            style={{ color: isRecordsSelected ? SELECTED_BORDER_COLOR : colors.muted }}
          >
            Categorias
          </Text>
        </Pressable>

        <Pressable
          testID={testID ? `${testID}-exercises-button` : undefined}
          accessibilityRole="button"
          accessibilityState={{ selected: isExercisesSelected }}
          accessibilityLabel="Exercícios"
          onPress={handleExercisesPress}
          className="flex-row items-center gap-1 rounded-full px-2.5 py-1 active:opacity-70"
          style={{
            borderWidth: 1,
            borderColor: isExercisesSelected ? SELECTED_BORDER_COLOR : colors.outline,
            backgroundColor: isExercisesSelected ? SELECTED_BACKGROUND_COLOR : colors.level1,
          }}
        >
          <Dumbbell
            size={16}
            color={isExercisesSelected ? SELECTED_BORDER_COLOR : colors.muted}
          />
          <Text
            className="text-sm font-medium"
            style={{ color: isExercisesSelected ? SELECTED_BORDER_COLOR : colors.muted }}
          >
            Exercícios
          </Text>
        </Pressable>
      </View>

      {showAll ? (
        <View className="flex-row gap-3">
          <View
            className={`flex-1 rounded-xl border ${
              showErrors && (totalScore === null || totalScore as any === "")
                ? "border-error"
                : "border-outline"
            } bg-level1 px-3 py-1.5`}
          >
            <Text className="text-xs font-medium text-muted">
              Pontuação total
            </Text>
            {readOnly ? (
              <Text className="text-xl font-bold text-white">
                {totalScore !== null ? String(totalScore) : "-"}
              </Text>
            ) : (
              <TextInput
                testID={testID ? `${testID}-total-score-input` : undefined}
                className="m-0 p-0 text-xl font-bold text-white"
                value={totalScore !== null ? String(totalScore) : ""}
                onChangeText={onChangeTotalScore}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor={colors.muted}
              />
            )}
          </View>

          <View
            className={`flex-1 rounded-xl border ${
              showErrors && (totalPercentile === null || totalPercentile === "")
                ? "border-error"
                : "border-outline"
            } bg-level1 px-3 py-1.5`}
          >
            <Text className="text-xs font-medium text-muted">
              Percentil total
            </Text>
            {readOnly ? (
              <Text className="text-xl font-bold text-white">
                {totalPercentile ?? "-"}
              </Text>
            ) : (
              <TextInput
                testID={testID ? `${testID}-total-percentile-input` : undefined}
                className="m-0 p-0 text-xl font-bold text-white"
                value={totalPercentile !== null ? String(totalPercentile) : ""}
                onChangeText={onChangeTotalPercentile}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor={colors.muted}
              />
            )}
          </View>
        </View>
      ) : null}

      {sections.map((section, index) => (
        <React.Fragment key={section.id ?? section.title}>
          {index > 0 ? <View className="h-px w-full bg-outline" /> : null}

          <Mabc2Section
            {...section}
            viewMode={viewFilter}
            readOnly={section.readOnly ?? readOnly}
            showErrors={showErrors}
            testID={
              section.testID ??
              (testID ? `${testID}-section-${index}` : undefined)
            }
          />
        </React.Fragment>
      ))}

      {!readOnly ? (
        <DefaultButton
          label={submitLabel}
          onPress={onRegister}
          bgColorClass="bg-primary"
          shadowClass="shadow-primaryShadow"
          sizeClass="w-full h-11"
          textClassName="text-white"
        />
      ) : null}
    </View>
  );
}