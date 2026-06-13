import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { BehaviorDetailCard } from "@/features/analysis/components/behavior-detail-card";
import { ObservedBehaviorsChart, BehaviorType, BehaviorRecord } from "@/features/analysis/components/observed-behaviors-chart";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { NoRecordsScreen } from "@/features/analysis/screens/no-records-screen";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useObservedBehaviors } from "@/features/analysis/hooks/use-observed-behaviors";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

const monthsPt = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatSingleDate(date: Date): string {
  const day = date.getDate();
  const month = monthsPt[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateRange(start: Date, end: Date): string {
  return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
}

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function ObservedBehaviorsScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();

  // Busca dados reais do banco, se disponíveis
  const { profile: dbProfile, isLoading: isDbLoading } = useStudentSessions(studentId as string);

  // Estados de data selecionados (Período)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const {
    records,
    exercises,
    isLoading: isBehaviorsLoading,
    error: behaviorsError,
    refetch,
  } = useObservedBehaviors(studentId as string, startDate, endDate);

  const profile = dbProfile;
  const isLoading = isDbLoading || isBehaviorsLoading;
  const hasError = !!behaviorsError;

  // Estados do Modal do Calendário
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);

  const handlePeriodPress = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsModalVisible(true);
  };

  const handleRangeSelected = (start: string, end: string | null) => {
    if (start) {
      setTempStart(parseDateString(start));
    } else {
      setTempStart(null);
    }

    if (end) {
      setTempEnd(parseDateString(end));
    } else {
      setTempEnd(null);
    }
  };

  const handleSavePeriod = () => {
    if (!tempStart || !tempEnd) {
      Alert.alert("Erro", "O período é obrigatório.");
      return;
    }

    setStartDate(tempStart);
    setEndDate(tempEnd);
    setIsModalVisible(false);
  };

  const isSaveDisabled = !tempStart || !tempEnd;

  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      return formatDateRange(startDate, endDate);
    }
    return "Selecione o período para visualizar os comportamentos";
  }, [startDate, endDate]);

  // Filtragem dos registros baseada no intervalo de datas selecionado (agora vindo do hook/banco)
  const filteredRecords = records;

  // Agrega dados filtrados para gerar a lista de detalhamento de comportamentos
  const aggregatedBehaviors = useMemo(() => {
    const result: {
      type: BehaviorType;
      behaviorName: string;
      color: string;
      occurrences: number;
      sessions: string[];
      exercises: string[];
      lastOccurrence: string;
    }[] = [];

    const keys: BehaviorType[] = ["stereotypy", "eye_contact", "engagement", "escape", "crisis"];

    const configMap: Record<BehaviorType, { label: string; color: string }> = {
      stereotypy: { label: "Estereotipias", color: "#09CDDB" },
      eye_contact: { label: "Contato visual", color: "#DBBF09" },
      engagement: { label: "Engajamento", color: "#34C759" },
      escape: { label: "Fuga", color: "#CB30E0" },
      crisis: { label: "Crises", color: "#FF383C" },
    };

    keys.forEach((key) => {
      const config = configMap[key];
      const recsForType = filteredRecords.filter((r) => r.behaviorType === key);

      if (recsForType.length > 0) {
        const occurrences = recsForType.reduce((sum, r) => sum + r.frequency, 0);

        // Extrai datas únicas das sessões de ocorrência e ordena do mais recente ao mais antigo
        const uniqueDates = Array.from(new Set(recsForType.map((r) => r.date))).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        // Formato de lista numerada para as sessões (ex: "1. Sessão de 12/06", "2. Sessão de 10/06")
        const formattedSessions = uniqueDates.map((dateStr, index) => {
          const [year, month, day] = dateStr.split("-").map(Number);
          const formattedMonth = String(month).padStart(2, "0");
          const formattedDay = String(day).padStart(2, "0");
          return `${index + 1}. Sessão de ${formattedDay}/${formattedMonth}`;
        });

        // Formata a última ocorrência no padrão DD/MM/AAAA
        const lastDateStr = uniqueDates[0];
        const [year, month, day] = lastDateStr.split("-").map(Number);
        const lastOccurrence = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

        const behaviorExercises = exercises[key] || [];

        result.push({
          type: key,
          behaviorName: config.label,
          color: config.color,
          occurrences,
          sessions: formattedSessions,
          exercises: behaviorExercises,
          lastOccurrence,
        });
      }
    });

    // Ordena por ocorrências decrescente
    return result.sort((a, b) => b.occurrences - a.occurrences);
  }, [filteredRecords, exercises]);

  const showResults = startDate && endDate;

  // Cenario: Erro de conexão ou erro desconhecido
  if (showResults && hasError) {
    return (
      <View className="flex-1 bg-level1">
        <NoRecordsScreen
          variant="loadRecords"
          title="Não foi possível carregar os comportamentos observados. Tente novamente."
          message="Verifique sua conexão ou tente acessar os dados novamente mais tarde."
          onPressBack={() => router.back()}
          onPrimaryAction={refetch}
          primaryActionLabel="Tentar novamente"
        />

        {/* Modal Overlay do Calendário (acessível no estado de erro) */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/60 justify-center items-center px-6"
            onPress={() => setIsModalVisible(false)}
          >
            <Pressable
              className="w-full max-w-[380px]"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Calendário */}
              <View className="w-full mb-4">
                <RangeCalendar
                  key={`${isModalVisible}`}
                  onRangeSelected={handleRangeSelected}
                />
              </View>

              {/* Botão de Salvar */}
              <View className="items-center">
                <DefaultButton
                  label="Salvar"
                  sizeClass="w-[168px] h-[44px]"
                  disabled={isSaveDisabled}
                  style={{ opacity: isSaveDisabled ? 0.5 : 1 }}
                  onPress={handleSavePeriod}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Cenario: Sem comportamentos observados no período
  if (showResults && filteredRecords.length === 0) {
    return (
      <View className="flex-1 bg-level1">
        <NoRecordsScreen
          variant="behavior"
          title="Ainda não há comportamentos observados para o período selecionado."
          message="Ainda não há comportamentos observados registrados para o período selecionado."
          studentName={profile?.name || "Aluno"}
          onPressBack={() => router.back()}
          onPrimaryAction={handlePeriodPress}
          primaryActionLabel="Alterar Período"
        />

        {/* Modal Overlay do Calendário (acessível no estado vazio) */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/60 justify-center items-center px-6"
            onPress={() => setIsModalVisible(false)}
          >
            <Pressable
              className="w-full max-w-[380px]"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Calendário */}
              <View className="w-full mb-4">
                <RangeCalendar
                  key={`${isModalVisible}`}
                  onRangeSelected={handleRangeSelected}
                />
              </View>

              {/* Botão de Salvar */}
              <View className="items-center">
                <DefaultButton
                  label="Salvar"
                  sizeClass="w-[168px] h-[44px]"
                  disabled={isSaveDisabled}
                  style={{ opacity: isSaveDisabled ? 0.5 : 1 }}
                  onPress={handleSavePeriod}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} className="flex-1">
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-5">
            {/* Nome do Aluno no Header da Página */}
            <Text
              className="text-xl font-bold text-white"
              style={{ marginHorizontal: 22, marginBottom: 16, fontFamily: "Inter-Bold" }}
            >
              Comportamentos Observados - {profile?.name || "Aluno"}
            </Text>

            {/* Seletor de Período */}
            <PeriodSelector
              label={periodLabel}
              onPress={handlePeriodPress}
            />

            {/* Conteúdo Dinâmico */}
            {showResults ? (
              <View className="mt-2">
                {/* Gráfico de Barras */}
                <View style={{ marginHorizontal: 22 }}>
                  <ObservedBehaviorsChart
                    records={records}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </View>

                {/* Título da Lista de Detalhes */}
                <Text
                  className="text-white text-lg font-bold mt-8 mb-4"
                  style={{ marginHorizontal: 22, fontFamily: "Inter-Bold" }}
                >
                  Detalhamento dos comportamentos
                </Text>

                {/* Lista de Cards de Detalhe */}
                <View style={{ marginHorizontal: 22 }} className="gap-4">
                  {aggregatedBehaviors.map((item) => (
                    <BehaviorDetailCard
                      key={item.type}
                      behaviorName={item.behaviorName}
                      color={item.color}
                      occurrences={item.occurrences}
                      sessions={item.sessions}
                      exercises={item.exercises}
                      lastOccurrence={item.lastOccurrence}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="items-center justify-center mt-12 px-8">
                <Text
                  className="text-muted text-center text-sm font-medium leading-[22px]"
                  style={{ fontFamily: "Inter-Medium" }}
                >
                  Selecione o período para visualizar os comportamentos
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Overlay do Calendário */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable
            className="w-full max-w-[380px]"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Calendário */}
            <View className="w-full mb-4">
              <RangeCalendar
                key={`${isModalVisible}`}
                onRangeSelected={handleRangeSelected}
              />
            </View>

            {/* Botão de Salvar */}
            <View className="items-center">
              <DefaultButton
                label="Salvar"
                sizeClass="w-[168px] h-[44px]"
                disabled={isSaveDisabled}
                style={{ opacity: isSaveDisabled ? 0.5 : 1 }}
                onPress={handleSavePeriod}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default ObservedBehaviorsScreen;
