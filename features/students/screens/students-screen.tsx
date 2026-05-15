import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { StudentItem } from "../components/student-item";
import { useStudents } from "../hooks/use-students";
import { NewStudent } from "../components/new-student";
import { ConfirmationModal } from "@/components/confirmation-modal";

export function StudentsScreen() {
  const { students, isLoading } = useStudents();
  const [isNewStudentModalVisible, setIsNewStudentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1">
        <View className="mx-8 mt-5">
          <PageHeader
            mode="inicio"
            title="Início"
            subtitle="Selecione um aluno para iniciar uma sessão"
            onNewPress={() => {
              setEditingStudent(null);
              setIsNewStudentModalVisible(true);
            }}
          />
        </View>
        <SearchInput 
          containerClassName="mx-8 mt-5" 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView className="mt-5 px-8" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <Text className="text-center text-placeholder mt-10">Carregando alunos...</Text>
          ) : students.length === 0 ? (
            <Text className="text-center text-placeholder mt-10 text-lg">Ainda não há alunos registrados</Text>
          ) : filteredStudents.length === 0 ? (
            <Text className="text-center text-placeholder mt-10 text-lg">Nenhum aluno encontrado</Text>
          ) : (
            filteredStudents.map((student) => (
              <StudentItem
                key={student.id}
                name={student.name}
                age={student.age}
                weight={student.weight}
                height={student.height}
                supportLevel={student.supportLevel}
                onEdit={() => {
                  setEditingStudent(student);
                  setIsNewStudentModalVisible(true);
                }}
                onRemove={() => setStudentToDelete(student)}
              />
            ))
          )}
          {/* Espaçamento extra no fim */}
          <View className="h-20" />
        </ScrollView>
      </View>
      <Footer />
      <NewStudent
        visible={isNewStudentModalVisible}
        mode={editingStudent ? "edit" : "create"}
        onClose={() => {
          setIsNewStudentModalVisible(false);
          setEditingStudent(null);
        }}
        handlePhotoPress={() => console.log('Photo press')}
        onSave={() => {
          setIsNewStudentModalVisible(false);
          setEditingStudent(null);
          console.log('Save student');
        }}
      />
      <ConfirmationModal
        visible={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          console.log('Excluir aluno', studentToDelete);
          setStudentToDelete(null);
        }}
      />
    </View>
  );
}
