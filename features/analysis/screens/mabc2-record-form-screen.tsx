import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultScrollView } from "@/components/default-scroll-view";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Edit2, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Mabc2MotorDevelopmentCard } from "../components/mabc2-motor-development-card";
import { Mabc2SectionProps } from "../components/mabc2-section";

export type Mabc2RecordFormScreenProps = {
  studentName: string;
  recordCount: number;
  totalScore: number | null;
  totalPercentile: string | null;
  sections: Mabc2SectionProps[];
  readOnly?: boolean;
  submitLabel?: string;
  onChangeTotalScore?: (value: string) => void;
  onChangeTotalPercentile?: (value: string) => void;
  onRegister?: () => void;
  onPressBack?: () => void;
  onViewRecords?: () => void;
  onViewExercises?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function Mabc2RecordFormScreen({
  studentName,
  recordCount,
  totalScore,
  totalPercentile,
  sections,
  readOnly = false,
  submitLabel = "Registrar",
  onChangeTotalScore,
  onChangeTotalPercentile,
  onRegister,
  onPressBack,
  onViewRecords,
  onViewExercises,
  onEdit,
  onDelete,
}: Mabc2RecordFormScreenProps) {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-5 mt-5 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <PageHeader
            title={`MABC-2 - ${studentName}`}
            subtitle="Desenvolvimento motor"
          />
        </View>

        {readOnly && (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onEdit}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-outline bg-level2 active:opacity-70"
            >
              <Edit2 size={18} color={colors.muted} />
            </Pressable>

            <Pressable
              onPress={() => setIsDeleteModalVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-2xl active:opacity-70"
              style={{
                borderWidth: 1,
                borderColor: colors.error,
                backgroundColor: `${colors.error}1A`,
              }}
            >
              <Trash2 size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>

      <DefaultScrollView
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Mabc2MotorDevelopmentCard
          recordCount={recordCount}
          totalScore={totalScore}
          totalPercentile={totalPercentile}
          sections={sections}
          onChangeTotalScore={onChangeTotalScore}
          onChangeTotalPercentile={onChangeTotalPercentile}
          onRegister={onRegister}
          onViewRecords={onViewRecords}
          onViewExercises={onViewExercises}
          readOnly={readOnly}
          submitLabel={submitLabel}
        />
      </DefaultScrollView>

      <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={() => {
          setIsDeleteModalVisible(false);
          onDelete?.();
        }}
        title="Excluir registro?"
        message={
          "Tem certeza que deseja excluir este registro de desenvolvimento motor?\nEsta ação não poderá ser desfeita."
        }
        mode="delete"
      />
    </View>
  );
}