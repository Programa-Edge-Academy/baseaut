import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { User } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, View, Image } from "react-native";
import { NewStudent } from "../components/new-student";
import { useStudents } from "../hooks/use-students";
import { router } from "expo-router";

/**
 * Students list screen with search and CRUD modals.
 */
export function StudentsScreen() {
  const { students, isLoading, refresh, addStudent, updateStudent, deleteStudent } =
    useStudents();
  const [isNewStudentModalVisible, setIsNewStudentModalVisible] =
    useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const hasPendingAlert = students.some(student => student.pendencyAlert);

  /**
   * Normalizes support level values to display labels.
   */
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
            mode={hasPendingAlert ? "inicio-pendente" : "inicio"}
            title="Início"
            subtitle="Selecione um aluno para iniciar uma sessão"
            onNewPress={() => {
              setEditingStudent(null);
              setIsNewStudentModalVisible(true);
            }}
            onHistoryPress={() => router.push("/history")}
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
            onRefresh={refresh}
            renderItem={({ item }) => (
              <ListCard
                title={item.name}
                pendencyAlert={item.pendencyAlert}
                subtitle={`${item.age} anos · ${item.weight}kg · ${item.height}cm · ${formatSupportLevel(item.supportLevel)}`}
                icon={
                  item.avatarUrl ? (
                    <Image
                      source={{ uri: item.avatarUrl }}
                      style={{ width: "100%", height: "100%", borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={20} color={colors.muted} />
                  )
                }
                iconBgColor={item.avatarUrl ? "transparent" : undefined}
                enableRipple={true}
                onPress={() => {
                  router.push({
                    pathname: "/circuit-selection",
                    params: { studentId: item.id, studentName: item.name }
                  });
                }}
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
