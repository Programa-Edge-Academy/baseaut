import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { ClipboardList, Dumbbell } from "lucide-react-native";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Mabc2Section, Mabc2SectionProps } from "./mabc2-section";

export type Mabc2MotorDevelopmentCardProps = {
  recordCount: number;
  totalScore: number | null;
  totalPercentile: string | null;
  onChangeTotalScore?: (value: string) => void;
  onChangeTotalPercentile?: (value: string) => void;
  sections: Mabc2SectionProps[];
  onRegister?: () => void;
  onViewRecords?: () => void;
  onViewExercises?: () => void;
  readOnly?: boolean;
  submitLabel?: string;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

export function Mabc2MotorDevelopmentCard({
  recordCount,
  totalScore,
  totalPercentile,
  onChangeTotalScore,
  onChangeTotalPercentile,
  sections,
  onRegister,
  onViewRecords,
  onViewExercises,
  readOnly = false,
  submitLabel = "Registrar",
  className,
  testID,
  accessibilityLabel = "Desenvolvimento motor",
}: Mabc2MotorDevelopmentCardProps) {
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
          accessibilityLabel={`Ver registros, ${recordCount} encontrados`}
          onPress={onViewRecords}
          className="flex-row items-center gap-1.5 rounded-xl border border-outline bg-level1 px-2.5 py-1 active:opacity-70"
        >
          <ClipboardList size={16} color={colors.muted} />
          <Text className="text-sm font-medium text-muted">
            Registros ({recordCount})
          </Text>
        </Pressable>

        <Pressable
          testID={testID ? `${testID}-exercises-button` : undefined}
          accessibilityRole="button"
          accessibilityLabel="Ver exercícios"
          onPress={onViewExercises}
          className="flex-row items-center gap-1 rounded-xl border border-outline bg-level1 px-2.5 py-1 active:opacity-70"
        >
          <Dumbbell size={16} color={colors.muted} />
          <Text className="text-sm font-medium text-muted">Exercícios</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 rounded-xl border border-outline bg-level1 px-3 py-1.5">
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

        <View className="flex-1 rounded-xl border border-outline bg-level1 px-3 py-1.5">
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

      {sections.map((section, index) => (
        <React.Fragment key={section.id ?? section.title}>
          {index > 0 ? <View className="h-px w-full bg-outline" /> : null}

          <Mabc2Section
            {...section}
            readOnly={section.readOnly ?? readOnly}
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