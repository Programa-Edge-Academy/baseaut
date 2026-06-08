import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { DefaultButton } from "@/components/default-button";
import { PeriodSelector } from "@/features/analysis/components/period-selector";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, X } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, Modal, Pressable } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

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

export function PerformanceComparisonScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { profile, isLoading } = useStudentSessions(studentId as string);

  // Ranges
  const [period1Range, setPeriod1Range] = useState<{ start: Date; end: Date } | null>(null);
  const [period2Range, setPeriod2Range] = useState<{ start: Date; end: Date } | null>(null);

  // Modal and Picker States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activePeriod, setActivePeriod] = useState<1 | 2 | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);

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

  const isSaveDisabled = !tempStart || !tempEnd || tempStart > tempEnd;

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
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable 
            className="bg-level2 border border-outline rounded-[15px] w-full max-w-[340px] p-[25px]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-header-2 text-white">
                Período {activePeriod}
              </Text>
              <Pressable onPress={() => setIsModalVisible(false)} className="p-1 active:opacity-70">
                <X color={colors.muted} size={24} />
              </Pressable>
            </View>

            <View className="gap-4 mb-6">
              {/* Data Inicial */}
              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Data inicial</Text>
                <Pressable
                  onPress={() => setShowPicker("start")}
                  className="w-full flex-row items-center justify-between bg-level1 border border-outline p-3 rounded-xl active:opacity-80"
                >
                  <View className="flex-row items-center">
                    <Calendar size={18} color={colors.muted} style={{ marginRight: 12 }} />
                    <Text className={`text-sm ${tempStart ? "text-white" : "text-muted"}`}>
                      {tempStart ? tempStart.toLocaleDateString("pt-BR") : "Selecionar data"}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Data Final */}
              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Data final</Text>
                <Pressable
                  onPress={() => setShowPicker("end")}
                  className="w-full flex-row items-center justify-between bg-level1 border border-outline p-3 rounded-xl active:opacity-80"
                >
                  <View className="flex-row items-center">
                    <Calendar size={18} color={colors.muted} style={{ marginRight: 12 }} />
                    <Text className={`text-sm ${tempEnd ? "text-white" : "text-muted"}`}>
                      {tempEnd ? tempEnd.toLocaleDateString("pt-BR") : "Selecionar data"}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Mensagem de Erro de Intervalo */}
              {tempStart && tempEnd && tempStart > tempEnd && (
                <Text className="text-default-3 text-error mt-1">
                  A data final deve ser igual ou posterior à data inicial.
                </Text>
              )}
            </View>

            {/* Botão Salvar (Fica embaixo do calendário/seletores no modal) */}
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

      {/* DateTimePicker nativo */}
      {showPicker === "start" && (
        <DateTimePicker
          value={tempStart || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(null);
            if (event.type === "set" && date) {
              setTempStart(date);
            }
          }}
          maximumDate={new Date()}
        />
      )}

      {showPicker === "end" && (
        <DateTimePicker
          value={tempEnd || tempStart || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(null);
            if (event.type === "set" && date) {
              setTempEnd(date);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

export default PerformanceComparisonScreen;
