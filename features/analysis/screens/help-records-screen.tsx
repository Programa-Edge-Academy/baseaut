import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { HelpRecordsBarChart } from "@/features/analysis/components/help-records-bar-chart";
import PeriodSelector from "@/features/analysis/components/period-selector";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useHelpRecords } from "../hooks/use-help-records";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BarChart3 } from "lucide-react-native";
import React, { useState } from "react";
import { AppModal } from "@/components/app-modal";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = months[parsedDate.getMonth()];
  const year = parsedDate.getFullYear();

  return `${day} ${month} ${year}`;
}

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function EmptyHelpRecordsState() {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIconContainer}>
        <BarChart3 size={46} color={colors.muted} strokeWidth={1.8} />
      </View>

      <Text style={styles.emptyText}>
        Ainda não há registros suficientes para visualizar{"\n"}
        a evolução dos registros de ajuda.
      </Text>
    </View>
  );
}

function ErrorHelpRecordsState() {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIconContainer}>
        <BarChart3 size={46} color={colors.muted} strokeWidth={1.8} />
      </View>

      <Text style={styles.errorTitle}>
        Não foi possível carregar a evolução dos{"\n"}
        registros de ajuda. Tente novamente.
      </Text>

      <Text style={styles.errorDescription}>
        Verifique sua conexão ou tente acessar{"\n"}
        os dados novamente mais tarde.
      </Text>
    </View>
  );
}

export function HelpRecordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const studentId = normalizeParam(
    params.studentId as string | string[] | undefined
  );

  const studentNameParam = normalizeParam(
    params.studentName as string | string[] | undefined
  );

  const { profile, isLoading: isProfileLoading } = useStudentProfile(studentId as string);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);

  const hasSelectedPeriod = Boolean(startDate && endDate);
  const canSavePeriod = Boolean(tempStartDate && tempEndDate);

  const {
    records: helpRecords,
    isLoading: isHelpLoading,
    error: helpError,
  } = useHelpRecords(studentId, startDate, endDate);

  const isLoading = isProfileLoading || isHelpLoading;

  const studentName =
    studentNameParam ||
    (profile as any)?.name ||
    (profile as any)?.nome ||
    (profile as any)?.studentName ||
    (profile as any)?.student_name ||
    "Aluno";

  const periodLabel =
    startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : "Selecione o período para visualizar os registros de ajuda";

  const selectedPeriodHasError = Boolean(helpError);

  const hasRecords = helpRecords.length > 0;

  function openCalendar() {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsModalVisible(true);
  }

  function savePeriod() {
    if (!tempStartDate || !tempEndDate) {
      return;
    }

    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setIsModalVisible(false);
  }

  const handleRangeSelected = (start: string, end: string | null) => {
    setTempStartDate(start);
    setTempEndDate(end);
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
      >
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-5">
            <Text
              className="text-xl font-bold text-white"
              style={{
                marginHorizontal: 22,
                marginBottom: 16,
                fontFamily: "Inter-Bold",
              }}
            >
              Registros de ajuda - {studentName}
            </Text>

            <PeriodSelector label={periodLabel} onPress={openCalendar} />

            {hasSelectedPeriod && selectedPeriodHasError && (
              <View style={styles.stateWrapper}>
                <ErrorHelpRecordsState />
              </View>
            )}

            {hasSelectedPeriod && !selectedPeriodHasError && !hasRecords && (
              <View style={styles.stateWrapper}>
                <EmptyHelpRecordsState />
              </View>
            )}

            {hasSelectedPeriod && !selectedPeriodHasError && hasRecords && (
              <View style={styles.chartWrapper}>
                <HelpRecordsBarChart sessions={helpRecords} />
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
                disabled={!canSavePeriod}
                style={{ opacity: !canSavePeriod ? 0.5 : 1 }}
                onPress={savePeriod}
              />
            </View>
          </Pressable>
        </Pressable>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    marginHorizontal: 22,
    marginTop: 16,
  },
  stateWrapper: {
    marginHorizontal: 22,
    marginTop: 16,
  },
  stateCard: {
    minHeight: 430,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    backgroundColor: colors.level2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    opacity: 0.85,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Inter-Medium",
    maxWidth: 310,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
    maxWidth: 320,
    marginBottom: 18,
  },
  errorDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Inter-Medium",
    maxWidth: 310,
  },
});

export default HelpRecordsScreen;