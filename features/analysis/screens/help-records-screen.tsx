import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import RangeCalendar from "@/components/range-calendar";
import { HelpRecordsBarChart } from "@/features/analysis/components/help-records-bar-chart";
import { HelpRecordsDetailModal } from "@/features/analysis/components/help-records-detail-modal";
import PeriodSelector from "@/features/analysis/components/period-selector";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useHelpRecords } from "../hooks/use-help-records";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
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

/** Month names per supported locale, used to format "DD Month YYYY". */
const MONTHS: Record<string, string[]> = {
  pt: [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

/** Formats a "YYYY-MM-DD" date as "DD Month YYYY" in the given locale. */
function formatDate(date: string, locale: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const months = MONTHS[locale] ?? MONTHS.pt;
  const month = months[parsedDate.getMonth()];
  const year = parsedDate.getFullYear();

  return `${day} ${month} ${year}`;
}

/** Returns the first value of a possibly-array route param. */
function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

/** Empty state shown when there are no help records for the period. */
function EmptyHelpRecordsState() {
  const { t } = useI18n();
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIconContainer}>
        <BarChart3 size={46} color={colors.muted} strokeWidth={1.8} />
      </View>

      <Text style={styles.emptyText}>
        {t("analysis.helpScreen.emptyText")}
      </Text>
    </View>
  );
}

/** Error state shown when help records fail to load. */
function ErrorHelpRecordsState() {
  const { t } = useI18n();
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIconContainer}>
        <BarChart3 size={46} color={colors.muted} strokeWidth={1.8} />
      </View>

      <Text style={styles.errorTitle}>
        {t("analysis.helpScreen.errorTitle")}
      </Text>

      <Text style={styles.errorDescription}>
        {t("analysis.helpScreen.errorDesc")}
      </Text>
    </View>
  );
}

/**
 * Screen showing a student's help/autonomy records as a bar chart for a selected
 * date range, with empty and error states and a date-range picker.
 */
export function HelpRecordsScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const params = useLocalSearchParams();

  const studentId = normalizeParam(
    params.studentId as string | string[] | undefined
  );

  const studentNameParam = normalizeParam(
    params.studentName as string | string[] | undefined
  );

  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const [noticeOpen, setNoticeOpen] = useState(false);

  const { profile, isLoading: isProfileLoading } = useStudentProfile(studentId as string, { mock: isTutorial });

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
  } = useHelpRecords(studentId, startDate, endDate, { mock: isTutorial });

  const isLoading = isProfileLoading || isHelpLoading;

  const studentName =
    studentNameParam ||
    (profile as any)?.name ||
    (profile as any)?.nome ||
    (profile as any)?.studentName ||
    (profile as any)?.student_name ||
    t("common.student");

  const periodLabel =
    startDate && endDate
      ? `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`
      : t("analysis.helpScreen.selectPeriod");

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
      <Header
        variant="back"
        onPressBack={() => router.back()}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
      />

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
              className="text-xl font-bold text-content"
              style={{
                marginHorizontal: 22,
                marginBottom: 16,
                fontFamily: "Inter-Bold",
              }}
            >
              {t("analysis.helpScreen.title")} - {studentName}
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
                <HelpRecordsDetailModal
                  studentId={studentId}
                  startDate={startDate}
                  endDate={endDate}
                />
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
                label={t("common.save")}
                sizeClass="w-full h-11"
                disabled={!canSavePeriod}
                style={{ opacity: !canSavePeriod ? 0.5 : 1 }}
                onPress={savePeriod}
              />
            </View>
          </Pressable>
        </Pressable>
      </AppModal>

      {isTutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => { setNoticeOpen(false); sessionSim.stop(); router.back(); }}
        />
      )}

      {isTutorial && <TutorialSpotlight />}
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