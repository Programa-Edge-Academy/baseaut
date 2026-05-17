import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { DataList } from "@/components/data-list";
import { ListCard } from "@/components/list-card";
import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useStudents } from "../hooks/use-students";
import { NewStudent } from "../components/new-student";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { colors } from "@/assets/colors";
import { User } from "lucide-react-native";

export function StudentsScreen() {
  const { students, isLoading, addStudent, updateStudent, deleteStudent } = useStudents();
  const [isNewStudentModalVisible, setIsNewStudentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSupportLevel = (level: string) => {
    if (level === "nivel_1" || level.includes("Nível 1")) return "TEA nível 1";
    if (level === "nivel_2" || level.includes("Nível 2")) return "TEA nível 2";
    if (level === "nivel_3" || level.includes("Nível 3")) return "TEA nível 3";
    return level;
  };

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

        <View className="mx-8 mt-5">
          <SearchInput
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <DataList
            className="mx-8 mt-5"
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum aluno encontrado."
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            renderItem={({ item }) => (
              <ListCard
                title={item.name}
                subtitle={`${item.age} anos · ${item.weight}kg · ${item.height}cm · ${formatSupportLevel(item.supportLevel)}`}
                icon={<User size={20} color={colors.muted} />}
                onEdit={() => {
                  setEditingStudent(item);
                  setIsNewStudentModalVisible(true);
                }}
                onDelete={() => setStudentToDelete(item)}
              />
            )}
          />
        )}
      </View>
      <Footer />

      <NewStudent
        visible={isNewStudentModalVisible}
        mode={editingStudent ? "edit" : "create"}
        initialData={editingStudent}
        onClose={() => {
          setIsNewStudentModalVisible(false);
          setEditingStudent(null);
        }}
        onSave={(data, photoUri) => {
          if (editingStudent) {
            updateStudent(editingStudent.id, data as any, photoUri);
          } else {
            addStudent(data as any, photoUri);
          }
          setIsNewStudentModalVisible(false);
          setEditingStudent(null);
        }}
      />

      <ConfirmationModal
        visible={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
          }
          setStudentToDelete(null);
        }}
        title="Excluir aluno?"
      />
    </View>
  );
}