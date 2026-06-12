import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { BehaviorDetailCard } from "@/features/analysis/components/behavior-detail-card";
import { ObservedBehaviorsChart, BehaviorType } from "@/features/analysis/components/observed-behaviors-chart";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { MOCK_BEHAVIOR_RECORDS, BEHAVIOR_EXERCISES_MAP } from "@/features/analysis/mocks/behavior-data";
import { NoRecordsScreen } from "@/features/analysis/screens/no-records-screen";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
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

  // Fallbacks de carregamento e perfil para modo de desenvolvimento/mock local
  const profile = studentId ? dbProfile : { name: "Gabriel (Mock)" };
  const isLoading = studentId ? isDbLoading : false;

  // Estados de data selecionados (Período)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

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
      return `Período: ${formatDateRange(startDate, endDate)}`;
    }
    return "Período: selecionar intervalo de datas";
  }, [startDate, endDate]);

  // Filtragem dos registros baseada no intervalo de datas selecionado
  const filteredRecords = useMemo(() => {
    if (!startDate || !endDate) return [];

    const compStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const compEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    return MOCK_BEHAVIOR_RECORDS.filter((rec) => {
      const recDate = new Date(rec.date);
      const compDate = new Date(recDate.getFullYear(), recDate.getMonth(), recDate.getDate());
      return compDate >= compStart && compDate <= compEnd;
    });
  }, [startDate, endDate]);

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

        const formattedSessions = uniqueDates.map((dateStr) => {
          const [year, month, day] = dateStr.split("-").map(Number);
          const formattedMonth = String(month).padStart(2, "0");
          const formattedDay = String(day).padStart(2, "0");
          return `Sessão de ${formattedDay}/${formattedMonth}`;
        });

        // Formata a última ocorrência no padrão DD/MM/AAAA
        const lastDateStr = uniqueDates[0];
        const [year, month, day] = lastDateStr.split("-").map(Number);
        const lastOccurrence = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

        const exercises = BEHAVIOR_EXERCISES_MAP[key] || [];

        result.push({
          type: key,
          behaviorName: config.label,
          color: config.color,
          occurrences,
          sessions: formattedSessions,
          exercises,
          lastOccurrence,
        });
      }
    });

    // Ordena por ocorrências decrescente
    return result.sort((a, b) => b.occurrences - a.occurrences);
  }, [filteredRecords]);

  const showResults = startDate && endDate;

  // Renderiza tela de estado vazio nativa se houver filtro sem registros
  if (showResults && filteredRecords.length === 0) {
    return (
      <View className="flex-1 bg-level1">
        <NoRecordsScreen
          variant="behavior"
          studentName={profile?.name || "Aluno"}
          onPressBack={() => router.back()}
          onPrimaryAction={handlePeriodPress}
          primaryActionLabel="Alterar Período"
        />

        {/* Modal Overlay do Calendário (acessível a partir do estado vazio) */}
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
            {/* Nome do Aluno */}
            <Text
              className="text-xl font-bold text-white"
              style={{ marginHorizontal: 22, marginBottom: 16, fontFamily: "Inter-Bold" }}
            >
              Comportamentos observados - {profile?.name || "Aluno"}
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
                    records={MOCK_BEHAVIOR_RECORDS}
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
                  Selecione um intervalo de datas acima para visualizar o gráfico e o detalhamento de comportamentos do aluno.
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
