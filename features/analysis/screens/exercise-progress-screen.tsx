import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
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

/**
 * Tela que exibe o progresso dos exercícios de um aluno específico.
 * Busca os dados do Supabase, permite selecionar exercícios individuais,
 * filtrar por período utilizando um calendário e visualizar a evolução em um gráfico.
 */
export function ExerciseProgressScreen() {
  const router = useRouter();
  
  // Captura os parâmetros dinâmicos passados pela rota do Expo Router (ID e nome do aluno)
  const { studentId, studentName } = useLocalSearchParams<{ studentId: string; studentName: string }>();

  // Hook personalizado integrado ao banco de dados Supabase para obter os exercícios e status de carregamento
  const { exercises, isLoading } = useExerciseProgress(studentId ?? "");

  // Estados locais da tela para gerenciar feedbacks de sucesso, erro ou ausência de dados
  const [screenState, setScreenState] = useState<"success" | "empty" | "error">("success");
  
  // Armazena as informações do exercício selecionado para detalhamento
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; title: string; sessions: number } | null>(null);
  
  // Controla a exibição do modal do calendário
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Guarda o intervalo de datas (início/fim) selecionado e salvo pelo usuário
  const [selectedRange, setSelectedRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  // Guarda o intervalo de datas temporário no modal antes de ser de fato aplicado/salvo pelo usuário
  const [tempRange, setTempRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });

  // Define o estado visual baseado no carregamento das informações ou se a lista de exercícios está vazia
  const currentStatus = isLoading 
    ? "loading" : screenState === "empty" || exercises.length === 0 ? "error" : screenState; 

  // Configuração visual para as telas de feedback de erro e de estado vazio (ícones, mensagens e ações)
  const stateConfig = {
    empty: { 
      title: "Ainda não há registros de sessão", 
      message: "Quando houver uma sessão salva para este aluno, ela aparecerá aqui para acompanhamento.", 
      icon: ChartNoAxesCombined, 
      accentColor: colors.primary, 
      buttonLabel: "Atualizar Lista" 
    },
    error: { 
      title: "Não foi possível carregar os registros", 
      message: "Tente novamente em alguns instantes ou verifique sua conexão para acessar os dados do aluno.", 
      icon: AlertCircle, 
      accentColor: "#EF4444", 
      buttonLabel: "Tentar Novamente" 
    }
  };

  // Retorna o rótulo de texto descritivo do período selecionado para exibição na interface
  const getPeriodLabel = () => {
    if (selectedRange.startDate && selectedRange.endDate) {
      if (selectedRange.startDate === selectedRange.endDate) {
        return `Data selecionada: ${formatDateToShow(selectedRange.startDate)}`;
      }
      return `Período: ${formatDateToShow(selectedRange.startDate)} até ${formatDateToShow(selectedRange.endDate)}`;
    }
    return undefined;
  };

  // Converte a string de data (AAAA-MM-DD) para formato legível brasileiro (DD/MM/AAAA)
  function formatDateToShow(dateStr: any): string {
    if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }

  // Converte uma string de data formatada em um objeto de data JavaScript nativo
  function parseStringToDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Atualiza o estado temporário do período conforme o usuário interage com o RangeCalendar
  const handleRangeSelected = (start: any, end: any) => {
    const startDateStr = typeof start === "string" ? start : start?.dateString || null;
    const endDateStr = typeof end === "string" ? end : end?.dateString || null;

    setTempRange({
      startDate: startDateStr,
      endDate: endDateStr || startDateStr 
    });
  };

  // Salva o período temporário definido pelo usuário no estado de filtragem real e fecha o calendário
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

  // Filtra os registros do gráfico de acordo com o intervalo de datas selecionado pelo usuário
  const filteredChartRecords = fullChartRecords.filter(record => {
    if (!selectedRange.startDate || !selectedRange.endDate) return true;
    
    const startTime = new Date(selectedRange.startDate + "T00:00:00").getTime();
    const endTime = new Date(selectedRange.endDate + "T00:00:00").getTime();
    const recordTime = new Date(record.rawDate + "T00:00:00").getTime();
    
    return recordTime >= startTime && recordTime <= endTime;
  });

  // Determina a data inicial para renderização da escala horizontal do gráfico
  const chartStartDate = selectedRange.startDate === selectedRange.endDate && filteredChartRecords.length > 0
    ? parseStringToDate(filteredChartRecords[0].rawDate)
    : parseStringToDate(selectedRange.startDate);

  // Determina a data final para renderização da escala horizontal do gráfico
  const chartEndDate = parseStringToDate(selectedRange.endDate);

  // Prepara a marcação visual de períodos para passar para o RangeCalendar
  const markedDates: any = {};
  if (tempRange.startDate) {
    markedDates[tempRange.startDate] = { startingDay: true, color: '#F04D23', textColor: '#FFFFFF', selected: true };
  }
  if (tempRange.endDate) {
    markedDates[tempRange.endDate] = { endingDay: true, color: '#F04D23', textColor: '#FFFFFF', selected: true };
  }

  return (
    <View className="flex-1 bg-level1">
      {/* Botão de navegação superior, com ação condicional para fechar modais/desmarcar itens */}
      <Header 
        variant="back" 
        onPressBack={() => {
          if (isCalendarOpen) setIsCalendarOpen(false);
          else if (selectedExercise) {
            // Se um exercício estiver aberto, limpa a seleção e volta à listagem de exercícios
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

      {/* Exibição condicional de acordo com o status atual dos dados */}
      {currentStatus === "loading" ? (
        // Componente de loading
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : currentStatus !== "success" ? (
        // Estado alternativo: Mensagem informativa de erro ou lista sem registros
        <View className="flex-1 justify-center px-8 py-4">
          <View className="w-full rounded-[32px] border border-outline bg-level2 p-6">
            <View className="mb-5 items-center justify-center rounded-[24px] p-5 self-center" style={{ backgroundColor: `${stateConfig[currentStatus as "empty" | "error"].accentColor}14` }}>
              {React.createElement(stateConfig[currentStatus as "empty" | "error"].icon, { size: 56, color: stateConfig[currentStatus as "empty" | "error"].accentColor, strokeWidth: 2 })}
            </View>
            <Text className="text-center text-[22px] font-bold text-white" style={{ fontFamily: "Inter-Bold" }}>{stateConfig[currentStatus as "empty" | "error"].title}</Text>
            <Text className="mt-3 text-center text-[14px] leading-6 text-muted" style={{ fontFamily: "Inter-Medium" }}>{stateConfig[currentStatus as "empty" | "error"].message}</Text>
            <View className="mt-6">
              <Pressable onPress={() => setScreenState("success")} className="items-center rounded-2xl px-4 py-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-[14px] font-semibold text-white">{stateConfig[currentStatus as "empty" | "error"].buttonLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        // Listagem dos exercícios do aluno
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="mt-6 gap-4">
            {exercises.map((exercise) => {
              const isSelected = selectedExercise?.id === exercise.id;
              const hasSavedRange = !!(selectedRange.startDate && selectedRange.endDate);
              const hasOnlyOneSession = exercise.sessions === 1;

              return (
                <View key={exercise.id} className="gap-4">
                  {/* Card do exercício */}
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

                  {/* Seção adicional visível apenas quando o card correspondente estiver selecionado */}
                  {isSelected && (
                    <View className="gap-3 -mt-2 mb-2 px-1">
                      {/* Seletor de período */}
                      <PeriodSelector 
                        label={getPeriodLabel()} 
                        onPress={() => setIsCalendarOpen(true)}
                      />

                      {/* Exibição do gráfico e alertas se houver período válido selecionado */}
                      {hasSavedRange && (
                        <View className="gap-3">
                          <ExerciseProgressChart
                            exerciseName={exercise.title}
                            records={filteredChartRecords} 
                            startDate={chartStartDate} 
                            endDate={chartEndDate}     
                          />
                          
                          {/* Alerta indicando que o exercício tem apenas um registro disponível */}
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

      {/* Modal para seleção do intervalo de datas */}
      <Modal visible={isCalendarOpen} transparent animationType="fade" onRequestClose={() => setIsCalendarOpen(false)}>
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
                label="Salvar"
                sizeClass="w-[168px] h-[44px]"
                disabled={!tempRange.startDate}
                style={{ opacity: !tempRange.startDate ? 0.5 : 1 }}
                onPress={handleSaveDate}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default ExerciseProgressScreen;