import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { ExerciseProgressChart } from "@/features/analysis/components/exercise-progress-chart";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, ChartNoAxesCombined, CircleAlert } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import RangeCalendar from "../../../components/range-calendar";
import { PeriodSelector } from "../components/period-selector";
import ProgressExerciseCard from "../components/progress-exercise-card";
import { useExerciseProgress } from "../hooks/use-exercise-progress";

export function ExerciseProgressScreen() {
  const router = useRouter();
  
  // Captura os parâmetros dinâmicos passados pela rota do Expo Router
  const { studentId, studentName } = useLocalSearchParams<{ studentId: string; studentName: string }>();

  // Hook real integrado ao banco de dados Supabase
  const { exercises, isLoading } = useExerciseProgress(studentId ?? "");

  const [screenState, setScreenState] = useState<"success" | "empty" | "error">("success");
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

  // Define o estado visual baseado no carregamento e nos dados retornados do Supabase
  const currentStatus = isLoading 
    ? "loading" : screenState === "empty" || exercises.length === 0 ? "error" : screenState; 

  const stateConfig = {
    empty: { title: "Ainda não há registros de sessão", message: "Quando houver uma sessão salva para este aluno, ela aparecerá aqui para acompanhamento.", icon: ChartNoAxesCombined, accentColor: colors.primary, buttonLabel: "Atualizar Lista" },
    error: { title: "Não foi possível carregar os registros", message: "Tente novamente em alguns instantes ou verifique sua conexão para acessar os dados do aluno.", icon: AlertCircle, accentColor: "#EF4444", buttonLabel: "Tentar Novamente" }
  };

  const getPeriodLabel = () => {
    if (selectedRange.startDate && selectedRange.endDate) {
      if (selectedRange.startDate === selectedRange.endDate) {
        return `Data selecionada: ${formatDateToShow(selectedRange.startDate)}`;
      }
      return `Período: ${formatDateToShow(selectedRange.startDate)} até ${formatDateToShow(selectedRange.endDate)}`;
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

  // Filtra dinamicamente os registros reais do exercício selecionado no banco
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

  const markedDates: any = {};
  if (tempRange.startDate) {
    markedDates[tempRange.startDate] = { startingDay: true, color: '#F04D23', textColor: '#FFFFFF', selected: true };
  }
  if (tempRange.endDate) {
    markedDates[tempRange.endDate] = { endingDay: true, color: '#F04D23', textColor: '#FFFFFF', selected: true };
  }

  return (
    <View className="flex-1 bg-level1">
      <Header 
        variant="back" 
        onPressBack={() => {
          if (isCalendarOpen) setIsCalendarOpen(false);
          else if (selectedExercise) {
            setSelectedExercise(null);
            setSelectedRange({ startDate: null, endDate: null });
            setTempRange({ startDate: null, endDate: null });
          } else router.back();
        }} 
      />

      <View className="mt-5 w-full">
        <Text className="text-xl font-bold text-white pl-8 mb-4" style={{ fontFamily: "Inter-Bold" }}>
          Progresso por exercício - {studentName ?? "Aluno"}
        </Text>
      </View>

      {currentStatus === "loading" ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : currentStatus !== "success" ? (
        <View className="flex-1 justify-center px-8 py-4">
          <View className="w-full rounded-[32px] border border-outline bg-level2 p-6">
            <View className="mb-5 items-center justify-center rounded-[24px] p-5 self-center" style={{ backgroundColor: `${stateConfig[currentStatus as "empty" | "error"].accentColor}14` }}>
              {React.createElement(stateConfig[currentStatus as "empty" | "error"].icon, { size: 56, color: stateConfig[currentStatus as "empty" | "error"].accentColor, strokeWidth: 2 })}
            </View>
            <Text className="text-center text-[22px] font-bold text-white" style={{ fontFamily: "Inter-Bold" }}>{stateConfig[currentStatus as "empty" | "error"].title}</Text>
            <Text className="mt-3 text-center text-[14px] leading-6 text-muted" style={{ fontFamily: "Inter-Medium" }}>{stateConfig[currentStatus as "empty" | "error"].message}</Text>
            <View className="mt-6">
              <Pressable onPress={() => setScreenState("success")} className="items-center rounded-2xl px-4 py-3" style={{ backgroundColor: colors.primary }}><Text className="text-[14px] font-semibold text-white">{stateConfig[currentStatus as "empty" | "error"].buttonLabel}</Text></Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="mt-6 gap-4">
            {exercises.map((exercise) => {
              const isSelected = selectedExercise?.id === exercise.id;
              const hasSavedRange = !!(selectedRange.startDate && selectedRange.endDate);
              const hasOnlyOneSession = exercise.sessions === 1;

              return (
                <View key={exercise.id} className="gap-4">
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
                    <View className="gap-3 -mt-2 mb-2 px-1">
                      <PeriodSelector 
                        label={getPeriodLabel()} 
                        onPress={() => setIsCalendarOpen(true)}
                      />

                      {hasSavedRange && (
                        <View className="gap-3">
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
                                Há apenas um registro disponível para este exercício. Ainda não é possível identificar evolução.
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

      {/* MODAL DO CALENDÁRIO */}
      <Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={() => setIsCalendarOpen(false)}>
        <TouchableOpacity className="flex-1 bg-black/50 justify-center items-center px-6" activeOpacity={1} onPress={() => setIsCalendarOpen(false)}>
          <View className="w-full overflow-hidden rounded-xl p-1">
            <RangeCalendar 
              onRangeSelected={handleRangeSelected} 
              {...({ 
                markedDates: markedDates, 
                markingType: 'period', 
                style: { width: '100%', borderRadius: 12 } 
              } as any)} 
            />
          </View>
          <View className="flex-row gap-3 w-full justify-end mt-2">
            <TouchableOpacity 
              className="px-6 py-3 rounded-xl flex-1 items-center justify-center" 
              style={{ backgroundColor: !tempRange.startDate ? '#E5E7EB' : colors.primary }} 
              disabled={!tempRange.startDate} 
              onPress={handleSaveDate}
            >
              <Text className="font-semibold" style={{ color: !tempRange.startDate ? '#000000' : '#FFFFFF' }}>
                Salvar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default ExerciseProgressScreen;