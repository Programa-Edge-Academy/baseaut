import { router, useLocalSearchParams } from "expo-router";
import { ClipboardList, Route, X } from "lucide-react-native";
import React, { useState, useMemo } from "react"; 
import { ActivityIndicator, Pressable, Text, View } from "react-native"; 
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker"; 

import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";

export default function HistoryDetailsScreen() {
  const { studentId } = useLocalSearchParams();
  const { sessions, profile, isLoading } = useStudentSessions(
    studentId as string,
  );

  // Estados para controle do filtro por data
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Manipulador de evento quando o usuário escolhe uma data no calendário
  const onChangeDate = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false); // Fecha o calendário
    if (event.type === "set" && date) {
      setSelectedDate(date); // Aplica a data selecionada
    }
  };

  // Filtra a lista localmente de forma rápida por string (DD/MM/AAAA)
  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions;

    const formattedFilterDate = selectedDate.toLocaleDateString("pt-BR");
    return sessions.filter((item) => item.date === formattedFilterDate);
  }, [selectedDate, sessions]);

  return (
    <View className="flex-1 bg-level1">
      <Header />

      <View className="mx-8 mt-5">
        <PageHeader
          title={profile ? `Histórico - ${profile.name}` : "Carregando..."}
          // Atualiza dinamicamente a contagem com base nos registros filtrados
          subtitle={`${filteredSessions.length} registros`}
          mode={"sessoes"}
          // 💡 Conecta o clique do botão de calendário do PageHeader ao estado
          onCalendarPress={() => setShowDatePicker(true)}
        />
      </View>

      {/* Badge visual indicando que há um filtro de data ativo + Botão para limpar */}
      {selectedDate && (
        <View className="mx-8 mt-3 flex-row items-center justify-between bg-level2 p-3 rounded-xl border border-outline">
          <Text className="text-default-2 text-muted">
            Filtrado por:{" "}
            <Text className="text-white font-semibold">
              {selectedDate.toLocaleDateString("pt-BR")}
            </Text>
          </Text>
          <Pressable
            onPress={() => setSelectedDate(null)}
            className="flex-row items-center gap-1 bg-level1 px-2 py-1 rounded-lg active:opacity-70"
          >
            <X size={14} color={colors.error} />
            <Text className="text-sm font-medium" style={{ color: colors.error }}>
              Limpar
            </Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DataList
          className="mx-8 mt-5"
          data={filteredSessions} // Agora consome os dados filtrados
          keyExtractor={(item) => item.id}
          // Mensagem adaptável se o filtro não encontrar nada
          emptyMessage={
            selectedDate
              ? "Nenhum registro encontrado nesta data."
              : "Nenhum registro encontrado para este aluno."
          }
          renderItem={({ item }) => {
            const isForm = item.type === "form";

            return (
              <ListCard
                title={item.title}
                subtitle={isForm ? item.date : `${item.date} · ${item.status}`}
                className={item.hasPendency ? "border-2 border-extra" : ""}
                icon={
                  isForm ? (
                    <ClipboardList size={22} color={colors.primary} />
                  ) : (
                    <Route size={20} color={colors.secondary} />
                  )
                }
                iconBgColor={
                  isForm ? `${colors.primary}26` : `${colors.secondary}26`
                }
                onPress={() => {
                  const studentName = profile?.name ?? "Aluno";
                  if (isForm) {
                    router.push({
                      pathname: "/history/form/[formId]",
                      params: { formId: item.id, studentName },
                    });
                  } else {
                    router.push({
                      pathname: "/history/session/[sessionId]",
                      params: { sessionId: item.id, studentName },
                    });
                  }
                }}
                enableRipple={true}
                rightAction="chevron"
              />
            );
          }}
        />
      )}

      {/* Componente nativo do Calendário do Sistema (iOS/Android) */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} // Impede selecionar datas futuras
        />
      )}

      <Footer />
    </View>
  );
}