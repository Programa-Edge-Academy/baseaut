import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { NewStudent } from "@/features/students/components/new-student";
import { CompanionCard } from "@/features/teams/components/companion-card";
import { StudentCardTeam } from "@/features/teams/components/student-card-team";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { StudentData, useTeamData } from "../hooks/use-team-data";

/**
 * Team management screen for companions and students.
 */
export function TeamScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    students,
    companions,
    isLoading,
    acceptCompanion,
    rejectCompanion,
    removeCompanion,
    saveStudent,
    deleteStudent,
  } = useTeamData();

  const [modalStudentVisible, setModalStudentVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(
    null,
  );

  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [companionToDelete, setCompanionToDelete] = useState<string | null>(
    null,
  );
  const [companionToReject, setCompanionToReject] = useState<string | null>(
    null,
  );

  /**
   * Selects a student for editing and opens the modal.
   */
  const handleEditStudent = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (student) {
      setEditingStudent(student);
      setModalStudentVisible(true);
    }
  };

  /**
   * Persists student changes and closes the modal.
   */
  const handleSaveStudent = async (
    data: Partial<StudentData>,
    photoUri: string | null,
  ) => {
    await saveStudent(data, photoUri);
    setModalStudentVisible(false);
    setEditingStudent(null);
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.replace("/students")} />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-8"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="mt-5 w-full">
            <PageHeader title="PEFaut" subtitle={t("teams.subtitle")} />
          </View>

          <View className="mt-5 w-full">
            <CompanionCard
              className="max-w-none"
              companions={companions}
              onAcceptCompanion={acceptCompanion}
              onRejectCompanion={(id) => setCompanionToReject(id)}
              onRemoveCompanion={(id) => setCompanionToDelete(id)}
            />
          </View>

          <View className="mt-5 w-full">
            <StudentCardTeam
              className="max-w-none"
              students={students}
              onAddPress={() => {
                setEditingStudent(null);
                setModalStudentVisible(true);
              }}
              onEditStudent={handleEditStudent}
              onRemoveStudent={(id) => setStudentToDelete(id)}
            />
          </View>
        </ScrollView>
      )}

      <NewStudent
        visible={modalStudentVisible}
        mode={editingStudent ? "edit" : "create"}
        initialData={editingStudent}
        onClose={() => {
          setModalStudentVisible(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
      />

      <ConfirmationModal
        visible={!!studentToDelete}
        title={t("teams.deleteStudentTitle")}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) deleteStudent(studentToDelete);
          setStudentToDelete(null);
        }}
      />

      <ConfirmationModal
        visible={!!companionToDelete}
        title={t("teams.removeCompanionTitle")}
        message={t("teams.removeCompanionMsg")}
        onClose={() => setCompanionToDelete(null)}
        onConfirm={() => {
          if (companionToDelete) removeCompanion(companionToDelete);
          setCompanionToDelete(null);
        }}
      />

      <ConfirmationModal
        visible={!!companionToReject}
        title={t("teams.rejectCompanionTitle")}
        message={t("teams.rejectCompanionMsg")}
        onClose={() => setCompanionToReject(null)}
        onConfirm={() => {
          if (companionToReject) rejectCompanion(companionToReject);
          setCompanionToReject(null);
        }}
      />
    </View>
  );
}
