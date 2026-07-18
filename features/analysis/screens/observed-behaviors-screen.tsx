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
import { useI18n } from "@/features/settings/contexts/i18n-context";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useObservedBehaviors } from "@/features/analysis/hooks/use-observed-behaviors";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

/** Month names per supported locale, used to format "D Month YYYY". */
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

/** Formats a date as "D Month YYYY" in the given locale. */
function formatSingleDate(date: Date, locale: string): string {
  const day = date.getDate();
  const months = MONTHS[locale] ?? MONTHS.pt;
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Formats a date range as "start - end". */
function formatDateRange(start: Date, end: Date, locale: string): string {
  return `${formatSingleDate(start, locale)} - ${formatSingleDate(end, locale)}`;
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
  const { t, locale } = useI18n();
  const { studentId } = useLocalSearchParams();

  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);

  const { profile: dbProfile, isLoading: isDbLoading } = useStudentProfile(studentId as string, { mock: isTutorial });

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const {
    records,
    exercises,
    isLoading: isBehaviorsLoading,
    error: behaviorsError,
    refetch,
  } = useObservedBehaviors(studentId as string, startDate, endDate, { mock: isTutorial });

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
      Alert.alert(t("common.error"), t("analysis.behaviorsScreen.periodRequired"));
      return;
    }

    if (isTutorial) sim.complete("periodBehaviors");
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setIsModalVisible(false);
  };

  const isSaveDisabled = !tempStart || !tempEnd;

  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      return formatDateRange(startDate, endDate, locale);
    }
    return t("analysis.behaviorsScreen.selectPeriod");
  }, [startDate, endDate, locale, t]);

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

    const configMap: Record<BehaviorType, { labelKey: TranslationKey; color: string }> = {
      stereotypy: { labelKey: "analysis.behaviorChart.stereotypy.legend", color: "#09CDDB" },
      eye_contact_people: { labelKey: "analysis.behaviorChart.eyePeople.legend", color: "#DBBF09" },
      eye_contact_objects: { labelKey: "analysis.behaviorChart.eyeObjects.legend", color: "#A6900A" },
      engagement: { labelKey: "analysis.behaviorChart.engagement.legend", color: "#34C759" },
      escape: { labelKey: "analysis.behaviorChart.escape.legend", color: "#CB30E0" },
      crisis: { labelKey: "analysis.behaviorChart.crisis.legend", color: "#FF383C" },
      unfit: { labelKey: "analysis.behaviorChart.unfit.legend", color: "#FF8A00" },
      preferred_activity: { labelKey: "analysis.behaviorChart.preferred.legend", color: "#1E88E5" },
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
          return `${index + 1}. ${t("analysis.behaviorsScreen.sessionOf")} ${formattedDay}/${formattedMonth}`;
        });

        const lastDateStr = uniqueDates[0];
        const [year, month, day] = lastDateStr.split("-").map(Number);
        const lastOccurrence = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

        const behaviorExercises = exercises[key] || [];

        result.push({
          type: key,
          behaviorName: t(config.labelKey),
          color: config.color,
          occurrences,
          sessions: formattedSessions,
          exercises: behaviorExercises,
          lastOccurrence,
        });
      }
    });

    return result.sort((a, b) => b.occurrences - a.occurrences);
  }, [filteredRecords, exercises, t]);

  const showResults = startDate && endDate;

  // In the tutorial the mock behaviors have fixed dates; the chart filters by
  // the selected period, so override its range to span the mock records (any
  // period keeps the chart populated, matching the always-shown detail cards).
  const tutorialChartRange = useMemo(() => {
    if (!isTutorial || records.length === 0) return null;
    const parse = (s: string) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    };
    const sorted = [...records].map((r) => r.date).sort();
    return { start: parse(sorted[0]), end: parse(sorted[sorted.length - 1]) };
  }, [isTutorial, records]);

  if (showResults && hasError) {
    return (
      <View className="flex-1 bg-level1">
        <NoRecordsScreen
          variant="loadRecords"
          title={t("analysis.behaviorsScreen.errorTitle")}
          message={t("analysis.behaviorsScreen.errorMessage")}
          onPressBack={() => router.back()}
          onPrimaryAction={refetch}
          primaryActionLabel={t("common.tryAgain")}
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
                  label={t("common.save")}
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
          title={t("analysis.behaviorsScreen.emptyTitle")}
          message={t("analysis.behaviorsScreen.emptyMessage")}
          studentName={profile?.name || t("common.student")}
          onPressBack={() => router.back()}
          onPrimaryAction={handlePeriodPress}
          primaryActionLabel={t("common.changePeriod")}
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
                  label={t("common.save")}
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
      <Header
        variant="back"
        onPressBack={() => {
          if (isTutorial) sim.complete("backBehaviors");
          router.back();
        }}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
        backSpotlightKey={isTutorial ? "backBehaviors" : undefined}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} className="flex-1">
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-5">
            <Text
              className="text-xl font-bold text-content"
              style={{ marginHorizontal: 22, marginBottom: 16, fontFamily: "Inter-Bold" }}
            >
              {t("analysis.behaviorsScreen.title")} - {profile?.name || t("common.student")}
            </Text>

            <PeriodSelector
              label={periodLabel}
              onPress={handlePeriodPress}
              spotlightKey={isTutorial ? "periodBehaviors" : undefined}
            />

            {showResults ? (
              <View className="mt-2">
                <View style={{ marginHorizontal: 22 }}>
                  <ObservedBehaviorsChart
                    records={records}
                    startDate={tutorialChartRange ? tutorialChartRange.start : startDate}
                    endDate={tutorialChartRange ? tutorialChartRange.end : endDate}
                  />
                </View>

                <Text
                  className="text-content text-lg font-bold mt-8 mb-4"
                  style={{ marginHorizontal: 22, fontFamily: "Inter-Bold" }}
                >
                  {t("analysis.behaviorsScreen.detailsTitle")}
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
                  {t("analysis.behaviorsScreen.selectPeriod")}
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
                label={t("common.save")}
                sizeClass="w-[168px] h-[44px]"
                disabled={isSaveDisabled}
                style={{ opacity: isSaveDisabled ? 0.5 : 1 }}
                onPress={handleSavePeriod}
              />
            </View>
          </Pressable>
        </Pressable>
      </AppModal>

      {isTutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => setNoticeOpen(false)}
        />
      )}

      {isTutorial && <TutorialSpotlight />}
    </View>
  );
}

export default ObservedBehaviorsScreen;
