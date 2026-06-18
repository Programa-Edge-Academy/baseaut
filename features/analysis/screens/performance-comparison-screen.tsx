import { colors } from "@/assets/colors";
import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import { AnalysisSummary } from "@/features/analysis/components/analysis-summary";
import ComparisonBehaviors from "@/features/analysis/components/comparison-behaviors";
import ComparisonHelp from "@/features/analysis/components/comparison-help";
import ExerciceComparisonCard from "@/features/analysis/components/exercice-comparison-card";
import { usePerformanceComparison } from "@/features/analysis/hooks/use-performance-comparison";

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

// Formatação do intervalo de datas do período.
function formatDateRange(start: Date, end: Date): string {
  return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
}

// Conversão local de datas para ranges de data.
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatToISODate(date: Date | undefined | null): string | undefined {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PerformanceComparisonScreen() {
  const router = useRouter();
  const { studentId: rawStudentId } = useLocalSearchParams();
  const studentId = Array.isArray(rawStudentId) ? rawStudentId[0] : rawStudentId ?? "";
  const { profile, isLoading } = useStudentSessions(studentId);

  // Ranges
  const [period1Range, setPeriod1Range] = useState<{ start: Date; end: Date } | null>(null);
  const [period2Range, setPeriod2Range] = useState<{ start: Date; end: Date } | null>(null);

  const [showResults, setShowResults] = useState(false);

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activePeriod, setActivePeriod] = useState<1 | 2 | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);

  // Hook centralizado para comparação de desempenho por períodos
  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    error: errorComparison,
  } = usePerformanceComparison(
    studentId,
    formatToISODate(period1Range?.start),
    formatToISODate(period1Range?.end),
    formatToISODate(period2Range?.start),
    formatToISODate(period2Range?.end),
    showResults
  );

  const handlePeriodPress = (periodNum: 1 | 2) => {
    setActivePeriod(periodNum);
    const range = periodNum === 1 ? period1Range : period2Range;
    setTempStart(range?.start || null);
    setTempEnd(range?.end || null);
    setIsModalVisible(true);
  };

  const handleSavePeriod = () => {
    if (!tempStart || !tempEnd) {
      Alert.alert("Erro", "O Período é obrigatório.");
      return;
    }
    const range = { start: tempStart, end: tempEnd };
    if (activePeriod === 1) {
      setPeriod1Range(range);
    } else {
      setPeriod2Range(range);
    }

    setShowResults(false);
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

  const handleComparePress = () => {
    if (!period1Range || !period2Range) {
      Alert.alert("Erro", "O Período 1 e o Período 2 são obrigatórios.");
      return;
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (
      period1Range.start > now || period1Range.end > now ||
      period2Range.start > now || period2Range.end > now
    ) {
      Alert.alert("Erro", "Data inválida. Não é possível comparar períodos futuros");
      return;
    }

    if (period1Range.start > period2Range.start) {
      Alert.alert("Erro", "Data inválida. Período 1 a frente do Período 2");
      return;
    }

    if (period1Range.start <= period2Range.end && period1Range.end >= period2Range.start) {
      Alert.alert("Erro", "Data inválida. Não é possível comparar dois períodos coincidentes");
      return;
    }

    setShowResults(true);
  };

  const isSaveDisabled = !tempStart || !tempEnd;
  const isCompareDisabled = !period1Range || !period2Range;

  const getLabel = (periodNum: 1 | 2, range: { start: Date; end: Date } | null) => {
    if (range) {
      return `Período ${periodNum}: ${formatDateRange(range.start, range.end)}`;
    }
    return `Período ${periodNum}: selecionar intervalo de datas`;
  };

  // Montagem dinâmica dos cartões do resumo da comparação
  const summaryCards = useMemo(() => {
    if (!comparisonData) return [];

    const { resumo, ajuda, exercicios, comportamentos } = comparisonData;

    const exerciciosP1 = (exercicios || []).filter((e) => e.nivel_p1 !== null).length;
    const exerciciosP2 = (exercicios || []).filter((e) => e.nivel_p2 !== null).length;

    const ajudaP1 = (ajuda?.autonomo?.p1 || 0) + (ajuda?.ajuda_intrusiva?.p1 || 0);
    const ajudaP2 = (ajuda?.autonomo?.p2 || 0) + (ajuda?.ajuda_intrusiva?.p2 || 0);

    const comportamentosP1 =
      (comportamentos?.estereotipia?.p1 || 0) +
      (comportamentos?.contato_visual?.p1 || 0) +
      (comportamentos?.engajamento?.p1 || 0) +
      (comportamentos?.fuga?.p1 || 0) +
      (comportamentos?.crise?.p1 || 0);

    const comportamentosP2 =
      (comportamentos?.estereotipia?.p2 || 0) +
      (comportamentos?.contato_visual?.p2 || 0) +
      (comportamentos?.engajamento?.p2 || 0) +
      (comportamentos?.fuga?.p2 || 0) +
      (comportamentos?.crise?.p2 || 0);

    return [
      {
        title: "Exercícios avaliados",
        period1: { label: "Período 1", value: exerciciosP1 },
        period2: { label: "Período 2", value: exerciciosP2 },
      },
      {
        title: "Registros de ajuda",
        period1: { label: "Período 1", value: ajudaP1 },
        period2: { label: "Período 2", value: ajudaP2 },
      },
      {
        title: "Comportamentos observados",
        period1: { label: "Período 1", value: comportamentosP1 },
        period2: { label: "Período 2", value: comportamentosP2 },
      },
      {
        title: "Sessões registradas",
        period1: { label: "Período 1", value: resumo?.sessoes_p1 ?? 0 },
        period2: { label: "Período 2", value: resumo?.sessoes_p2 ?? 0 },
      },
    ];
  }, [comparisonData]);

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

            {/* Botão Comparar */}
            <View className="items-center mt-6">
              <DefaultButton
                label="Comparar"
                sizeClass="w-[168px] h-[44px]"
                disabled={isCompareDisabled}
                style={{ opacity: isCompareDisabled ? 0.5 : 1 }}
                onPress={handleComparePress}
              />
            </View>

            {/* Renderização condicional e ordenada dos componentes após clicar em Comparar */}
            {showResults && (
              <View className="mt-6 gap-6">
                {isLoadingComparison ? (
                  <View className="items-center justify-center py-10">
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : errorComparison ? (
                  <Text className="text-red-400 text-center py-4 px-6">{errorComparison}</Text>
                ) : (
                  <>
                    <AnalysisSummary cards={summaryCards} />

                    <ExerciceComparisonCard 
                      exercicios={comparisonData?.exercicios || []}
                    />

                    <ComparisonHelp data={comparisonData?.ajuda} />

                    <ComparisonBehaviors data={comparisonData?.comportamentos} />
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Overlay com fade-out (Tela Escurecida) */}
      <AppModal
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
      </AppModal>
    </View>
  );
}

export default PerformanceComparisonScreen;