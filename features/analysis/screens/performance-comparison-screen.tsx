import { colors } from "@/assets/colors";
import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { AnalysisSummary } from "@/features/analysis/components/analysis-summary";
import ComparisonBehaviors from "@/features/analysis/components/comparison-behaviors";
import ComparisonHelp from "@/features/analysis/components/comparison-help";
import ExerciceComparisonCard from "@/features/analysis/components/exercice-comparison-card";
import { usePerformanceComparison } from "@/features/analysis/hooks/use-performance-comparison";
import { PageHeader } from "@/components/page-header";

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

/** Formats a Date as a "YYYY-MM-DD" string, or undefined when absent. */
function formatToISODate(date: Date | undefined | null): string | undefined {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Screen for comparing a student's performance between two date ranges. Validates
 * the selected periods (no overlap, no future dates) and renders the summary,
 * per-exercise, help, and behavior comparisons.
 */
export function PerformanceComparisonScreen() {
  const router = useRouter();
  const { studentId: rawStudentId } = useLocalSearchParams();
  const studentId = Array.isArray(rawStudentId) ? rawStudentId[0] : rawStudentId ?? "";
  const { profile, isLoading } = useStudentProfile(studentId);

  const [period1Range, setPeriod1Range] = useState<{ start: Date; end: Date } | null>(null);
  const [period2Range, setPeriod2Range] = useState<{ start: Date; end: Date } | null>(null);

  const [showResults, setShowResults] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activePeriod, setActivePeriod] = useState<1 | 2 | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

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
    setModalError(null);
    setActivePeriod(periodNum);
    const range = periodNum === 1 ? period1Range : period2Range;
    setTempStart(range?.start || null);
    setTempEnd(range?.end || null);
    setIsModalVisible(true);
  };

  const handleSavePeriod = () => {
    setModalError(null);

    if (!tempStart || !tempEnd) {
      setModalError("O Período é obrigatório. Selecione o início e o fim no calendário.");
      return;
    }

    const startMs = tempStart.getTime();
    const endMs = tempEnd.getTime();
    const nowMs = new Date().setHours(23, 59, 59, 999);

    if (startMs > nowMs || endMs > nowMs) {
      setModalError("Data inválida. Não é possível selecionar períodos futuros.");
      return;
    }

    if (activePeriod === 1 && period2Range) {
      const p2StartMs = period2Range.start.getTime();
      const p2EndMs = period2Range.end.getTime();

      if (startMs > p2StartMs) {
        setModalError("O Período 1 não pode iniciar depois do Período 2.");
        return;
      }
      if (startMs <= p2EndMs && endMs >= p2StartMs) {
        setModalError("As datas não podem coincidir com o Período 2.");
        return;
      }
    }

    if (activePeriod === 2 && period1Range) {
      const p1StartMs = period1Range.start.getTime();
      const p1EndMs = period1Range.end.getTime();

      if (p1StartMs > startMs) {
        setModalError("O Período 2 não pode iniciar antes do Período 1.");
        return;
      }
      if (p1StartMs <= endMs && p1EndMs >= startMs) {
        setModalError("As datas não podem coincidir com o Período 1.");
        return;
      }
    }

    const range = { start: tempStart, end: tempEnd };
    if (activePeriod === 1) {
      setPeriod1Range(range);
    } else {
      setPeriod2Range(range);
    }

    setCompareError(null);
    setShowResults(false);
    setIsModalVisible(false);
  };

  const handleRangeSelected = (start: string, end: string | null) => {
    setModalError(null);
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
    setCompareError(null);
    
    if (!period1Range || !period2Range) {
      setCompareError("Ambos os períodos são obrigatórios para a comparação.");
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

  const summaryCards = useMemo(() => {
    if (!comparisonData) return [];
    const { resumo, ajuda, exercicios, comportamentos } = comparisonData;

    const exerciciosP1 = (exercicios || []).filter((e) => e.nivel_p1 !== null).length;
    const exerciciosP2 = (exercicios || []).filter((e) => e.nivel_p2 !== null).length;

    const ajudaP1 = (ajuda?.autonomo?.p1 || 0) + (ajuda?.ajuda_intrusiva?.p1 || 0);
    const ajudaP2 = (ajuda?.autonomo?.p2 || 0) + (ajuda?.ajuda_intrusiva?.p2 || 0);

    const comportamentosP1 =
      (comportamentos?.estereotipia?.p1 || 0) +
      (comportamentos?.contato_visual_pessoas?.p1 || 0) +
      (comportamentos?.contato_visual_objetos?.p1 || 0) +
      (comportamentos?.engajamento?.p1 || 0) +
      (comportamentos?.fuga?.p1 || 0) +
      (comportamentos?.crise?.p1 || 0) +
      (comportamentos?.inapto?.p1 || 0) +
      (comportamentos?.atividade_preferencial?.p1 || 0);

    const comportamentosP2 =
      (comportamentos?.estereotipia?.p2 || 0) +
      (comportamentos?.contato_visual_pessoas?.p2 || 0) +
      (comportamentos?.contato_visual_objetos?.p2 || 0) +
      (comportamentos?.engajamento?.p2 || 0) +
      (comportamentos?.fuga?.p2 || 0) +
      (comportamentos?.crise?.p2 || 0) +
      (comportamentos?.inapto?.p2 || 0) +
      (comportamentos?.atividade_preferencial?.p2 || 0);

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
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} className="flex-1">
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mx-8 mt-5">
            <PageHeader title={`Comparar desempenho - ${profile?.name || "Aluno"}`} subtitle=""></PageHeader>

            <PeriodSelector
              containerStyle={{marginHorizontal: 0}}
              label={getLabel(1, period1Range)}
              onPress={() => handlePeriodPress(1)}
              />

            <PeriodSelector
              containerStyle={{marginHorizontal: 0}}
              label={getLabel(2, period2Range)}
              onPress={() => handlePeriodPress(2)}
            />

            {compareError && (
              <Text className="text-red-400 text-sm font-medium text-center mt-4 px-6">
                {compareError}
              </Text>
            )}

            <View className="items-center mt-2">
              <DefaultButton
                label="Comparar"
                sizeClass="w-full h-[44px]"
                disabled={false}
                style={{ opacity: isCompareDisabled ? 0.5 : 1 }}
                onPress={handleComparePress}
              />
            </View>

            {showResults && (
              <View className="mt-4 gap-4">
                {isLoadingComparison ? (
                  <View className="items-center justify-center py-10">
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : errorComparison ? (
                  <Text className="text-red-400 text-center py-4 px-6">{errorComparison}</Text>
                ) : (
                  <>
                    <AnalysisSummary cards={summaryCards} />
                    <ExerciceComparisonCard exercicios={comparisonData?.exercicios || []} />
                    <ComparisonHelp data={comparisonData?.ajuda} />
                    <ComparisonBehaviors data={comparisonData?.comportamentos} />
                  </>
                )}
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
                key={`${activePeriod}-${isModalVisible}`}
                onRangeSelected={handleRangeSelected}
              />
            </View>

            {modalError && (
              <View className="bg-red-500/10 border border-red-500/50 rounded-lg p-2 mb-4 mx-2">
                 <Text className="text-red-400 text-xs font-medium text-center">
                   {modalError}
                 </Text>
              </View>
            )}

            <View className="items-center">
              <DefaultButton
                label="Salvar"
                sizeClass="w-full h-11"
                disabled={false}
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
