import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Calendar } from "lucide-react-native";

import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import { DataList } from "@/components/data-list";
import { ListCard } from "@/components/list-card";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions"; // Ajuste o caminho conforme seu projeto

export default function HistoryDetailsScreen() {
  const { studentId } = useLocalSearchParams();
  const { sessions, profile, isLoading } = useStudentSessions(studentId as string);

  return (
    <View className="flex-1 bg-level1">
      <Header />

      <View className="mx-8 mt-5">
        <PageHeader
          title={profile ? `Histórico - ${profile.name}` : "Carregando..."}
          subtitle={`${sessions.length} sessões`}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DataList
          className="mx-8 mt-5"
          data={sessions}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhuma sessão encontrada para este aluno."
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              subtitle={`${item.date} · ${item.status}`}
              // 💡 Lógica da Borda Amarela:
              // Se tiver pendência, usa 'border-warning' (ou a classe equivalente no seu tema),
              // caso contrário, mantém a borda padrão do ListCard.
              className={item.hasPendency ? "border-2 colors.extra" : ""}
              icon={<Calendar size={20} color={colors.muted} />}
              onPress={() => {
                console.log(`Abrindo detalhes da sessão: ${item.id}`);
                // router.push(`/session/${item.id}`);
              }}
            />
          )}
        />
      )}

      <Footer />
    </View>
  );
}