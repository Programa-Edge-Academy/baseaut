import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";

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

export function PerformanceComparisonScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { profile, isLoading } = useStudentSessions(studentId as string);

  // Ranges
  const [period1Range, setPeriod1Range] = useState<{ start: Date; end: Date } | null>(null);
  const [period2Range, setPeriod2Range] = useState<{ start: Date; end: Date } | null>(null);

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activePeriod, setActivePeriod] = useState<1 | 2 | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);

  const handlePeriodPress = (periodNum: 1 | 2) => {
    setActivePeriod(periodNum);
    const range = periodNum === 1 ? period1Range : period2Range;
    setTempStart(range?.start || null);
    setTempEnd(range?.end || null);
    setIsModalVisible(true);
  };

  const handleSavePeriod = () => {
    if (!tempStart || !tempEnd) return;
    const range = { start: tempStart, end: tempEnd };
    if (activePeriod === 1) {
      setPeriod1Range(range);
    } else {
      setPeriod2Range(range);
    }
    setIsModalVisible(false);
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

  const isSaveDisabled = !tempStart || !tempEnd;

  const getLabel = (periodNum: 1 | 2, range: { start: Date; end: Date } | null) => {
    if (range) {
      return `Período ${periodNum}: ${formatDateRange(range.start, range.end)}`;
    }
    return `Período ${periodNum}: selecionar intervalo de datas`;
  };

  return (
    <View className="flex-1 bg-level1">
      {/* Cabeçalho de navegação */}
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} className="flex-1">
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-5">
            {/* Título com nome do aluno */}
            <Text
              className="text-xl font-bold text-white"
              style={{ marginHorizontal: 22, marginBottom: 16, fontFamily: "Inter-Bold" }}
            >
              Comparar desempenho - {profile?.name || "Aluno"}
            </Text>

            {/* Seletores de Período */}
            <PeriodSelector
              label={getLabel(1, period1Range)}
              onPress={() => handlePeriodPress(1)}
            />

            <PeriodSelector
              label={getLabel(2, period2Range)}
              onPress={() => handlePeriodPress(2)}
            />

            {/* Botão Comparar (Aparece quando ambos os períodos estiverem definidos) */}
            {period1Range && period2Range && (
              <View className="items-center mt-6">
                <DefaultButton
                  label="Comparar"
                  sizeClass="w-[168px] h-[44px]"
                  onPress={() => console.log("Botão Comparar pressionado")}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Overlay com fade-out (Tela Escurecida) */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        {/* Fade-out: Clicar aqui fecha o modal */}
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsModalVisible(false)}
        >
          {/* Container Flutuante Invisível: Clicar aqui NÃO fecha o modal */}
          <Pressable
            className="w-full max-w-[380px]"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Calendário de Seleção de Range */}
            <View className="w-full mb-4">
              <RangeCalendar
                key={`${activePeriod}-${isModalVisible}`}
                onRangeSelected={handleRangeSelected}
              />
            </View>

            {/* Botão Salvar (Fica embaixo do calendário no modal) */}
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

export default PerformanceComparisonScreen;