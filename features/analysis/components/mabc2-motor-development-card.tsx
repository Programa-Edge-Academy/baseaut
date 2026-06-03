import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { ClipboardList, Dumbbell } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Mabc2Section, Mabc2SectionProps } from "./mabc2-section";

export type Mabc2MotorDevelopmentCardProps = {
  recordCount: number;
  totalScore: number | null;
  totalPercentile: string | null;
  sections: Mabc2SectionProps[];
  onRegister?: () => void;
  onViewRecords?: () => void;
  onViewExercises?: () => void;
  readOnly?: boolean;
};

export function Mabc2MotorDevelopmentCard({
  recordCount,
  totalScore,
  totalPercentile,
  sections,
  onRegister,
  onViewRecords,
  onViewExercises,
  readOnly = false,
}: Mabc2MotorDevelopmentCardProps) {
  return (
    <View className="w-full rounded-xl border border-outline bg-level2 p-4 gap-4">
      <Text className="text-base font-bold text-white">Desenvolvimento motor</Text>

      <View className="flex-row gap-2.5">
        <Pressable
          onPress={onViewRecords}
          className="flex-row items-center gap-1.5 rounded-xl border border-outline bg-level1 px-2.5 py-1 active:opacity-70"
        >
          <ClipboardList size={16} color={colors.muted} />
          <Text className="text-sm font-medium text-muted">
            Registros ({recordCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={onViewExercises}
          className="flex-row items-center gap-1 rounded-xl border border-outline bg-level1 px-2.5 py-1 active:opacity-70"
        >
          <Dumbbell size={16} color={colors.muted} />
          <Text className="text-sm font-medium text-muted">Exercícios</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 rounded-xl border border-outline bg-level1 px-3 py-1.5">
          <Text className="text-xs font-medium text-muted">Pontuação total</Text>
          <Text className="text-xl font-bold text-white">
            {totalScore !== null ? String(totalScore) : "—"}
          </Text>
        </View>
        <View className="flex-1 rounded-xl border border-outline bg-level1 px-3 py-1.5">
          <Text className="text-xs font-medium text-muted">Percentil total</Text>
          <Text className="text-xl font-bold text-white">
            {totalPercentile ?? "—"}
          </Text>
        </View>
      </View>

      {sections.map((section, index) => (
        <React.Fragment key={section.title}>
          {index > 0 && (
            <View className="h-px bg-outline w-full" />
          )}
          <Mabc2Section {...section} readOnly={readOnly} />
        </React.Fragment>
      ))}

      {!readOnly && (
        <DefaultButton
          label="Registrar"
          onPress={onRegister}
          bgColorClass="bg-primary"
          shadowClass="shadow-primaryShadow"
          sizeClass="w-full h-11"
          textClassName="text-white"
        />
      )}
    </View>
  );
}