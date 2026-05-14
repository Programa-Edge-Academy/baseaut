import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import React from "react";
import { View, Text, ScrollView } from "react-native";
import { StudentItem } from "../components/student-item";
import { useStudents } from "../hooks/use-students";

export function StudentsScreen() {
  const { students, isLoading } = useStudents();

  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1">
        <View className="mx-8 mt-5">
          <PageHeader
            mode="inicio"
            title="Início"
            subtitle="Selecione um aluno para iniciar uma sessão"
            onNewPress={() => { }}
          />
        </View>
        <SearchInput containerClassName="mx-8 mt-5" />

        <ScrollView className="mt-5 px-8" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <Text className="text-center text-placeholder mt-10">Carregando alunos...</Text>
          ) : students.length === 0 ? (
            <Text className="text-center text-placeholder mt-10 text-lg">Ainda não há alunos registrados</Text>
          ) : (
            students.map((student) => (
              <StudentItem
                key={student.id}
                name={student.name}
                age={student.age}
                weight={student.weight}
                height={student.height}
                supportLevel={student.supportLevel}
              />
            ))
          )}
          {/* Espaçamento extra no fim */}
          <View className="h-20" />
        </ScrollView>
      </View>
      <Footer />
    </View>
  );
}
