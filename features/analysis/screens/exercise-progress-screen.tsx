import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import { ExerciseProgressChart } from "@/features/analysis/components/exercise-progress-chart";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, ChartNoAxesCombined, CircleAlert } from "lucide-react-native";
import React, { useState } from "react";
import { AppModal } from "@/components/app-modal";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import RangeCalendar from "../../../components/range-calendar";
import { PeriodSelector } from "../components/period-selector";
import ProgressExerciseCard from "../components/progress-exercise-card";
import { useExerciseProgress } from "../hooks/use-exercise-progress";
import { useStudentProfile } from "@/features/sessions/hooks/use-student-profile";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";

/**
 * Screen showing a student's exercise progress. Loads the data, lets the user
 * select individual exercises, filter by a date range via a calendar, and view
 * the evolution in a chart.
 */
export function ExerciseProgressScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const { studentId, studentName } = useLocalSearchParams<{ studentId: string; studentName: string }>();
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const [noticeOpen, setNoticeOpen] = useState(false);

  const { exercises, isLoading, error, refetch } = useExerciseProgress(studentId ?? "", { mock: isTutorial });

  const { profile } = useStudentProfile(studentId as string, { mock: isTutorial });
  const displayName = profile?.name ?? studentName ?? t("common.student");

  const [selectedExercise, setSelectedExercise] = useState<{ id: string; title: string; sessions: number } | null>(null);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [selectedRange, setSelectedRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  const [tempRange, setTempRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  const currentStatus = isLoading
    ? "loading"
    : error
      ? "error"
      : exercises.length === 0
        ? "empty"
        : "success";

  const stateConfig = {
    empty: {
      title: t("analysis.noRecords.sessions.title"),
      message: t("analysis.noRecords.sessions.message"),
      icon: ChartNoAxesCombined,
      accentColor: colors.primary,
      buttonLabel: t("common.updateList")
    },
    error: {
      title: t("analysis.noRecords.loadRecords.title"),
      message: t("analysis.noRecords.loadRecords.message"),
      icon: AlertCircle,
      accentColor: "#EF4444",
      buttonLabel: t("common.tryAgain")
    }
  };

  const getPeriodLabel = () => {
    if (selectedRange.startDate && selectedRange.endDate) {
      if (selectedRange.startDate === selectedRange.endDate) {
        return `${t("analysis.period.selectedDate")}: ${formatDateToShow(selectedRange.startDate)}`;
      }
      return `${t("analysis.period.range")}: ${formatDateToShow(selectedRange.startDate)} ${t("common.until")} ${formatDateToShow(selectedRange.endDate)}`;
    }
    return undefined;
  };

  function formatDateToShow(dateStr: any): string {
    if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }

  function parseStringToDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const handleRangeSelected = (start: any, end: any) => {
    const startDateStr = typeof start === "string" ? start : start?.dateString || null;
    const endDateStr = typeof end === "string" ? end : end?.dateString || null;

    setTempRange({
      startDate: startDateStr,
      endDate: endDateStr || startDateStr 
    });
  };

  const handleSaveDate = () => {
    if (tempRange.startDate) {
      setSelectedRange({
        startDate: tempRange.startDate,
        endDate: tempRange.endDate || tempRange.startDate
      });
      setIsCalendarOpen(false);
    }
  };

  const currentExerciseData = exercises.find(ex => ex.id === selectedExercise?.id);
  const fullChartRecords = currentExerciseData ? currentExerciseData.records : [];

  const filteredChartRecords = fullChartRecords.filter(record => {
    if (!selectedRange.startDate || !selectedRange.endDate) return true;
    
    const startTime = new Date(selectedRange.startDate + "T00:00:00").getTime();
    const endTime = new Date(selectedRange.endDate + "T00:00:00").getTime();
    const recordTime = new Date(record.rawDate + "T00:00:00").getTime();
    
    return recordTime >= startTime && recordTime <= endTime;
  });

  const chartStartDate = selectedRange.startDate === selectedRange.endDate && filteredChartRecords.length > 0
    ? parseStringToDate(filteredChartRecords[0].rawDate)
    : parseStringToDate(selectedRange.startDate);

  const chartEndDate = parseStringToDate(selectedRange.endDate);

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => {router.back();}}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
      />

      <View className="mt-5 w-full">
        <Text className="text-xl font-bold text-content pl-8 mb-4" style={{ fontFamily: "Inter-Bold" }}>
          {t("analysis.card.progress.title")} - {displayName}
        </Text>
      </View>

      {currentStatus === "loading" ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : currentStatus !== "success" ? (
        <View className="flex-1 justify-center px-8 py-4">
          <View className="w-full rounded-[32px] border border-outline bg-level2 p-6">
            <View className="mb-5 items-center justify-center rounded-[24px] p-5 self-center" style={{ backgroundColor: `${stateConfig[currentStatus as "empty" | "error"].accentColor}14` }}>
              {React.createElement(stateConfig[currentStatus as "empty" | "error"].icon, { size: 56, color: stateConfig[currentStatus as "empty" | "error"].accentColor, strokeWidth: 2 })}
            </View>
            <Text className="text-center text-[22px] font-bold text-content" style={{ fontFamily: "Inter-Bold" }}>{stateConfig[currentStatus as "empty" | "error"].title}</Text>
            <Text className="mt-3 text-center text-[14px] leading-6 text-muted" style={{ fontFamily: "Inter-Medium" }}>{stateConfig[currentStatus as "empty" | "error"].message}</Text>
            <View className="mt-6">
              <Pressable onPress={() => refetch()} className="items-center rounded-2xl px-4 py-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-[14px] font-semibold text-content">{stateConfig[currentStatus as "empty" | "error"].buttonLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="mt-6 gap-2">
            {exercises.map((exercise) => {
              const isSelected = selectedExercise?.id === exercise.id;
              const hasSavedRange = !!(selectedRange.startDate && selectedRange.endDate);
              const hasOnlyOneSession = exercise.sessions === 1;

              return (
                <View key={exercise.id} className="gap-2">
                  <ProgressExerciseCard
                    title={exercise.title}
                    statusLabel={exercise.statusLabel}
                    statusTone={exercise.statusTone}
                    sessions={exercise.sessions}
                    evolutionLabel={exercise.evolutionLabel}
                    evolutionTone={exercise.evolutionTone} 
                    style={isSelected ? { borderWidth: 1, borderColor: colors.primary } : undefined}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedExercise(null);
                        setSelectedRange({ startDate: null, endDate: null });
                        setTempRange({ startDate: null, endDate: null });
                      } else {
                        setSelectedExercise({ id: exercise.id, title: exercise.title, sessions: exercise.sessions });
                        setSelectedRange({ startDate: null, endDate: null }); 
                        setTempRange({ startDate: null, endDate: null });
                      }
                    }}
                  />

                  {isSelected && (
                    <View className="gap-2 mt-2 mb-4">
                      <PeriodSelector
                        containerStyle={{marginVertical: 0, marginHorizontal: 0}}
                        label={getPeriodLabel()} 
                        onPress={() => setIsCalendarOpen(true)}
                      />

                      {hasSavedRange && (
                        <View className="">
                          <ExerciseProgressChart
                            exerciseName={exercise.title}
                            records={filteredChartRecords}
                            startDate={chartStartDate}
                            endDate={chartEndDate}
                          />

                          {hasOnlyOneSession && (
                            <View className="flex-row items-center gap-3 p-4 rounded-xl border mt-1" style={{ backgroundColor: colors.level2, borderColor: '#464646' }}>
                              <CircleAlert size={20} color="#B5BEC6" />
                              <Text className="flex-1 text-sm font-medium leading-5" style={{ color: '#B5BEC6' }}>
                                {t("analysis.progressChart.singleRecordWarning")}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <AppModal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={() => setIsCalendarOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-center items-center px-6" onPress={() => setIsCalendarOpen(false)}>
          <Pressable className="w-full max-w-[380px]" onPress={(e) => e.stopPropagation()}>
            <View className="w-full mb-4">
              <RangeCalendar 
                key={`${isCalendarOpen}`}
                onRangeSelected={handleRangeSelected} 
              />
            </View>

            <View className="items-center">
              <DefaultButton
                label={t("common.save")}
                sizeClass="w-full h-11"
                disabled={!tempRange.startDate}
                style={{ opacity: !tempRange.startDate ? 0.5 : 1 }}
                onPress={handleSaveDate}
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

export default ExerciseProgressScreen;
