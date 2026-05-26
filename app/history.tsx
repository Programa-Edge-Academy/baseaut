import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list"; // 🟢 Alinhado com o padrão do projeto
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { SectionField } from "@/components/section-field";
import { StudentItemSessions } from "@/features/students/components/student-item-sessions";

import { useHistory } from "@/features/sessions/hooks/use-history"; // 🟢 Hook personalizado para lidar com o histórico de sessões

export default function HistoryScreen() {
  const { studentsHistory, isLoading, error } = useHistory();
  const [query, setQuery] = useState("");

  // Filtro em tempo real por nome
  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return studentsHistory.filter((student) => {
      return !normalizedQuery || student.name.toLowerCase().includes(normalizedQuery);
    });
  }, [query, studentsHistory]);

  // Renderização do corpo seguindo estritamente o exemplo funcional fornecido
  const renderListBody = () => {
    if (isLoading) {
      return (
        <View className="mt-16 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View className="mt-16 items-center justify-center px-8">
          <Text className="text-center text-base font-medium text-extra">
            {error.message || "Erro ao carregar o histórico."}
          </Text>
        </View>
      );
    }

    return (
      <DataList
        className="mt-5 px-8"
        data={filteredHistory}
        emptyMessage="Nenhum histórico encontrado." // O DataList já renderiza o texto de vazio automaticamente
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentItemSessions
            name={item.name}
            sessions={item.sessions}
            pendencyAlert={item.pendencyAlert}
            onClick={() => {
              console.log(`Navegando para os detalhes do aluno: ${item.id}`);
            }}
          />
        )}
      />
    );
  };

  return (
    <View className="flex-1 bg-level1">
      <Header />

      <View className="mx-8 mt-5">
      <PageHeader
        title="Histórico de registros"
        subtitle="Selecione um aluno para acessar registros passados"
      />
      </View>

      <View className="flex-1">

        <View className="relative z-10 mx-8 mt-5">
          <SearchInput
            placeholder="Buscar aluno no histórico..."
            value={query}
            onChangeText={setQuery}
            showTags={false}
          />
        </View>

        {renderListBody()}
      </View>

      <Footer />
    </View>
  );
}