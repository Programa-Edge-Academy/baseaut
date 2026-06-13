import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { HelpRecordsBarChart } from "@/features/analysis/components/help-records-bar-chart";
import PeriodSelector from "@/features/analysis/components/period-selector";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BarChart3 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const mockHelpRecords = [
  {
    sessionId: "1",
    sessionLabel: "1",
    sessionDate: "2026-06-01",
    intrusiveCount: 6,
    autonomousCount: 2,
  },
  {
    sessionId: "2",
    sessionLabel: "2",
    sessionDate: "2026-06-02",
    intrusiveCount: 4,
    autonomousCount: 5,
  },
  {
    sessionId: "3",
    sessionLabel: "3",
    sessionDate: "2026-06-05",
    intrusiveCount: 3,
    autonomousCount: 6,
  },
  {
    sessionId: "4",
    sessionLabel: "4",
    sessionDate: "2026-06-08",
    intrusiveCount: 2,
    autonomousCount: 8,
  },
];

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

const SAVE_BUTTON_ACTIVE_COLOR = "#1E90FF";
const SAVE_BUTTON_DISABLED_COLOR = "rgba(30, 144, 255, 0.35)";

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

  const { profile, isLoading } = useStudentSessions(studentId as string);

  const [showCalendar, setShowCalendar] = useState(false);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);

  const hasSelectedPeriod = Boolean(startDate && endDate);
  const canSavePeriod = Boolean(tempStartDate && tempEndDate);

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

  /**
   * Estado de erro preparado para integração futura.
   *
   * Quando a tela for integrada ao back-end, troque este valor pelo estado real
   * da requisição, por exemplo:
   *
   * const selectedPeriodHasError = isError;
   *
   * ou:
   *
   * const selectedPeriodHasError = Boolean(error);
   */
  const selectedPeriodHasError = false;

  const helpRecords = useMemo(() => {
    if (!startDate || !endDate) {
      return [];
    }

    const selectedStart = new Date(`${startDate}T00:00:00`);
    const selectedEnd = new Date(`${endDate}T00:00:00`);

    return mockHelpRecords
      .filter((record) => {
        const recordDate = new Date(`${record.sessionDate}T00:00:00`);

        return recordDate >= selectedStart && recordDate <= selectedEnd;
      })
      .map((record) => ({
        sessionId: record.sessionId,
        sessionLabel: record.sessionLabel,
        intrusiveCount: record.intrusiveCount,
        autonomousCount: record.autonomousCount,
      }));
  }, [startDate, endDate]);

  const hasRecords = helpRecords.length > 0;

  function openCalendar() {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowCalendar(true);
  }

  function savePeriod() {
    if (!tempStartDate || !tempEndDate) {
      return;
    }

    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowCalendar(false);
  }

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

      {showCalendar && (
        <View style={styles.calendarOverlay}>
          <Pressable
            style={styles.calendarBackdrop}
            onPress={() => setShowCalendar(false)}
          />

          <View style={styles.calendarContent}>
            <View style={styles.calendarBox}>
              <RangeCalendar
                onRangeSelected={(start, end) => {
                  setTempStartDate(start);
                  setTempEndDate(end);
                }}
              />
            </View>

            <Pressable
              disabled={!canSavePeriod}
              onPress={savePeriod}
              style={({ pressed }) => [
                styles.saveButtonPressable,
                pressed && canSavePeriod && styles.saveButtonPressed,
              ]}
            >
              <View
                style={[
                  styles.saveButtonBox,
                  {
                    backgroundColor: canSavePeriod
                      ? SAVE_BUTTON_ACTIVE_COLOR
                      : SAVE_BUTTON_DISABLED_COLOR,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    !canSavePeriod && styles.saveButtonTextDisabled,
                  ]}
                >
                  Salvar
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}
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
  calendarOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
  },
  calendarContent: {
    width: 330,
    maxWidth: "86%",
    alignItems: "center",
  },
  calendarBox: {
    width: "100%",
  },
  saveButtonPressable: {
    width: 220,
    height: 54,
    marginTop: 22,
    borderRadius: 16,
  },
  saveButtonBox: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: SAVE_BUTTON_ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  saveButtonTextDisabled: {
    opacity: 0.65,
  },
});

export default HelpRecordsScreen;