import React, { useMemo, useState } from "react";
// 🛠️ Unificado: Mantido apenas uma linha com Image importado
import { ActivityIndicator, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { User } from "lucide-react-native";

import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list"; 
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";

// 🛠️ Corrigido o caminho do hook conforme a versão mais recente
import { useHistory } from "@/features/sessions/hooks/use-history";

export default function HistoryScreen() {
  const { studentsHistory, isLoading, error, refetch } = useHistory();
  const [query, setQuery] = useState("");

  // Filtro em tempo real por nome (simplificado e sem o bug de retorno implícito truncado)
  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return studentsHistory.filter((student) => {
      return student.name.toLowerCase().includes(normalizedQuery);
    });
  }, [query, studentsHistory]);

  // Renderização do corpo da listagem
  const renderListBody = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-white text-center">
            {error.message || "Erro ao carregar o histórico."}
          </Text>
        </View>
      );
    }

    return (
      <DataList
        className="mt-5 px-8"
        data={filteredHistory}
        emptyMessage="Nenhum aluno encontrado."
        onRefresh={refetch}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListCard
            title={item.name}
            subtitle={`${item.sessions} registros`} 
            pendencyAlert={item.pendencyAlert}
            
            // 🛠️ IMPLEMENTAÇÃO DA FOTO COM FALLBACK
            icon={
              item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatarUrl }}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : (
                <User size={20} color={colors.primary} />
              )
            }
            iconBgColor={item.avatarUrl ? "transparent" : `${colors.primary}26`}
            
            onPress={() => {
              router.push(`../history/${item.id}`);
            }}
            enableRipple={true}
          />
        )}
      />
    );
  };

  return (
    <View className="flex-1 bg-level1">
      {/* 🛠️ Cabeçalho com botão de voltar configurado */}
      <Header variant="back" onPressBack={() => router.back()} />

      <View className="mx-8 mt-5">
        <PageHeader 
          title="Histórico de Alunos" 
          subtitle="Busque e gerencie os registros"
        />
      </View>

      <View className="flex-1">
        {/* 🛠️ Input de busca adicionado corretamente */}
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

    </View>
  );
}