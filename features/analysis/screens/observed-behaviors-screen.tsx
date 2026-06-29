import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { BehaviorDetailCard } from "@/features/analysis/components/behavior-detail-card";
import { ObservedBehaviorsChart, BehaviorType } from "@/features/analysis/components/observed-behaviors-chart";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { NoRecordsScreen } from "@/features/analysis/screens/no-records-screen";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useObservedBehaviors } from "@/features/analysis/hooks/use-observed-behaviors";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

const monthsPt = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/** Formats a date as "D Month YYYY" in Portuguese. */
function formatSingleDate(date: Date): string {
  const day = date.getDate();
  const month = monthsPt[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Formats a date range as "start - end". */
function formatDateRange(start: Date, end: Date): string {
  return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
}

/** Parses a "YYYY-MM-DD" string into a local Date. */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Screen showing a student's observed behaviors for a selected period: a
 * frequency bar chart and per-behavior detail cards, with empty and error
 * states and a date-range picker.
 */
export function ObservedBehaviorsScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();

  const { profile: dbProfile, isLoading: isDbLoading } = useStudentProfile(studentId as string);

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

  const filteredRecords = records;

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

    const keys: BehaviorType[] = ["stereotypy", "eye_contact_people", "eye_contact_objects", "engagement", "escape", "crisis", "unfit", "preferred_activity"];

    const configMap: Record<BehaviorType, { label: string; color: string }> = {
      stereotypy: { label: "Estereotipias", color: "#09CDDB" },
      eye_contact_people: { label: "Contato visual (Pessoas)", color: "#DBBF09" },
      eye_contact_objects: { label: "Contato visual (Objetos)", color: "#A6900A" },
      engagement: { label: "Engajamento", color: "#34C759" },
      escape: { label: "Fuga", color: "#CB30E0" },
      crisis: { label: "Crises", color: "#FF383C" },
      unfit: { label: "Comportamentos inaptos", color: "#FF8A00" },
      preferred_activity: { label: "Atividades preferenciais", color: "#1E88E5" },
    };

    keys.forEach((key) => {
      const config = configMap[key];
      const recsForType = filteredRecords.filter((r) => r.behaviorType === key);

      if (recsForType.length > 0) {
        const occurrences = recsForType.reduce((sum, r) => sum + r.frequency, 0);

        const uniqueDates = Array.from(new Set(recsForType.map((r) => r.date))).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        const formattedSessions = uniqueDates.map((dateStr, index) => {
          const [, month, day] = dateStr.split("-").map(Number);
          const formattedMonth = String(month).padStart(2, "0");
          const formattedDay = String(day).padStart(2, "0");
          return `${index + 1}. Sessão de ${formattedDay}/${formattedMonth}`;
        });

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

    return result.sort((a, b) => b.occurrences - a.occurrences);
  }, [filteredRecords, exercises]);

  const showResults = startDate && endDate;

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

        <AppModal
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
              <View className="w-full mb-4">
                <RangeCalendar
                  key={`${isModalVisible}`}
                  onRangeSelected={handleRangeSelected}
                />
              </View>

              <View className="items-center">
                <DefaultButton
                  label="Salvar"
                  sizeClass="w-full h-11"
                  disabled={isSaveDisabled}
                  style={{ opacity: isSaveDisabled ? 0.5 : 1 }}
                  onPress={handleSavePeriod}
                />
              </View>
            </Pressable>
          </Pressable>
        </AppModal>
      </View>
    );
  }

  if (showResults && !isLoading && !hasError && filteredRecords.length === 0) {
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

        <AppModal
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
              <View className="w-full mb-4">
                <RangeCalendar
                  key={`${isModalVisible}`}
                  onRangeSelected={handleRangeSelected}
                />
              </View>

              <View className="items-center">
                <DefaultButton
                  label="Salvar"
                  sizeClass="w-full h-11"
                  disabled={isSaveDisabled}
                  style={{ opacity: isSaveDisabled ? 0.5 : 1 }}
                  onPress={handleSavePeriod}
                />
              </View>
            </Pressable>
          </Pressable>
        </AppModal>
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
            <Text
              className="text-xl font-bold text-white"
              style={{ marginHorizontal: 22, marginBottom: 16, fontFamily: "Inter-Bold" }}
            >
              Comportamentos Observados - {profile?.name || "Aluno"}
            </Text>

            <PeriodSelector
              label={periodLabel}
              onPress={handlePeriodPress}
            />

            {showResults ? (
              <View className="mt-2">
                <View style={{ marginHorizontal: 22 }}>
                  <ObservedBehaviorsChart
                    records={records}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </View>

                <Text
                  className="text-white text-lg font-bold mt-8 mb-4"
                  style={{ marginHorizontal: 22, fontFamily: "Inter-Bold" }}
                >
                  Detalhamento dos comportamentos
                </Text>

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

      <AppModal
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
            <View className="w-full mb-4">
              <RangeCalendar
                key={`${isModalVisible}`}
                onRangeSelected={handleRangeSelected}
              />
            </View>

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
      </AppModal>
    </View>
  );
}

export default ObservedBehaviorsScreen;
