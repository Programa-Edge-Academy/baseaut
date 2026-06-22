import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { User } from "lucide-react-native";

import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";

import { useHistory } from "@/features/sessions/hooks/use-history";

export default function HistoryScreen() {
  const { studentsHistory, isLoading, error, refetch } = useHistory();
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const [query, setQuery] = useState("");

  // Filtro em tempo real por nome
  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return studentsHistory.filter((student) => {
      return !normalizedQuery || student.name.toLowerCase().includes(normalizedQuery);
    });
  }, [query, studentsHistory]);

  // Renderização do corpo
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
        emptyMessage="Nenhum histórico encontrado."
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListCard
            title={item.name}
            subtitle={`${item.sessions} registros`}
            pendencyAlert={item.pendencyAlert}
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
      <Header variant="back" onPressBack={() => router.back()} />

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

    </View>
  );
}