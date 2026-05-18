import { Header } from "@/components/header";
import React, { useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { PageHeader } from "@/components/page-header";
import { CompanionCard } from "@/features/teams/components/companion-card";
import { StudentCardTeam } from "@/features/teams/components/student-card-team";
import { useTeamData, StudentData } from "../hooks/use-team-data";
import { NewStudent } from "@/features/students/components/new-student";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useRouter } from "expo-router";
import { colors } from "@/assets/colors";

export function TeamScreen() {
  const router = useRouter();
  const { 
    students, 
    companions, 
    isLoading, 
    acceptCompanion, 
    rejectCompanion, 
    removeCompanion,
    saveStudent,
    deleteStudent
  } = useTeamData();

  const [modalStudentVisible, setModalStudentVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [companionToDelete, setCompanionToDelete] = useState<string | null>(null);

  const handleEditStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      setEditingStudent(student);
      setModalStudentVisible(true);
    }
  };

  const handleSaveStudent = async (data: Partial<StudentData>, photoUri: string | null) => {
    await saveStudent(data, photoUri);
    setModalStudentVisible(false);
    setEditingStudent(null);
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>        
          <View className="mt-5 w-full">
            <PageHeader
              title="PEFaut"
              subtitle="Gerenciar equipe"
            />
          </View>        
          
          <View className="mt-5 w-full">
            <CompanionCard
              className="max-w-none"
              companions={companions}
              onAcceptCompanion={acceptCompanion}
              onRejectCompanion={rejectCompanion}
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
        title="Excluir aluno?"
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) deleteStudent(studentToDelete);
          setStudentToDelete(null);
        }}
      />

      <ConfirmationModal
        visible={!!companionToDelete}
        title="Excluir monitor?"
        onClose={() => setCompanionToDelete(null)}
        onConfirm={() => {
          if (companionToDelete) removeCompanion(companionToDelete);
          setCompanionToDelete(null);
        }}
      />
    </View>
  );
}