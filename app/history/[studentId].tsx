import { router, useLocalSearchParams } from "expo-router";
import { ClipboardList, Route, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import RangeCalendar from "@/components/range-calendar";
import { parseLocalDate } from "@/lib/date-utils";

export default function HistoryDetailsScreen() {
  const { studentId } = useLocalSearchParams();
  const { sessions, profile, isLoading, refetch} = useStudentSessions(
    studentId as string,
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions;
    // Compara apenas a parte de data, em horário local
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const formattedFilterDate = `${d}/${m}/${y}`;
    return sessions.filter((item) => item.date === formattedFilterDate);
  }, [selectedDate, sessions]);

  // Auxiliar para definir propriedades visuais do card
  const getCardVisuals = (item: any) => {
    switch (item.type) {
      case "form":
        return {
          iconColor: colors.primary,
          bgColor: withOpacity(colors.primary, 0.15),
          IconComponent: ClipboardList,
          subtitle: item.date,
        };
      case "session": {
        const feita = item.totalRealizado ?? 0;
        const total = item.totalPrevisto ?? 0;

        return {
          iconColor: colors.secondary,
          bgColor: withOpacity(colors.secondary, 0.15),
          IconComponent: Route,
          // Formato: {DATA} · {Feito}/{Total} realizado
          subtitle: `${item.date} · ${feita}/${total} realizado`,
        };
      }
      case "mabc": {
        const feita = item.totalRealizado ?? 0;
        const total = item.totalPrevisto ?? 0;
        const age = item.ageAtEvent;

        // Cor baseada na faixa etária do aluno no momento da avaliação
        // 3–6 anos: laranja | 7–10 anos: verde | 11–16 anos: roxo
        let mabcColor = colors.mabc3; // padrão: roxo (11-16)
        if (age !== undefined) {
          if (age >= 3 && age <= 6) mabcColor = colors.mabc1;
          else if (age >= 7 && age <= 10) mabcColor = colors.mabc2;
          else if (age >= 11 && age <= 16) mabcColor = colors.mabc3;
        } else if (item.faixaMabc !== undefined) {
          if (item.faixaMabc === 1) mabcColor = colors.mabc1;
          else if (item.faixaMabc === 2) mabcColor = colors.mabc2;
          else if (item.faixaMabc === 3) mabcColor = colors.mabc3;
        }

        return {
          iconColor: mabcColor,
          bgColor: withOpacity(mabcColor, 0.15),
          IconComponent: Route,
          subtitle: `${item.date} · ${feita}/${total} realizado`,
        };
      }
      default:
        return {
          iconColor: colors.primary,
          bgColor: withOpacity(colors.primary, 0.15),
          IconComponent: ClipboardList,
          subtitle: item.date,
        };
    }
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <View className="mx-8 mt-5">
        <PageHeader
          title={profile ? `Histórico - ${profile.name}` : "Carregando..."}
          subtitle={`${filteredSessions.length} registros`}
          mode={"sessoes"}
          onCalendarPress={() => setShowDatePicker(true)}
        />
      </View>

      {selectedDate && (
        <View className="mx-8 mt-3 flex-row items-center justify-between bg-level2 p-3 rounded-xl border border-outline">
          <Text className="text-default-2 text-muted">
            Filtrado por:{" "}
            <Text className="text-white font-semibold">
              {selectedDate.toLocaleDateString("pt-BR")}
            </Text>
          </Text>
          <Pressable
            onPress={() => setSelectedDate(null)}
            className="flex-row items-center gap-1 bg-level1 px-2 py-1 rounded-lg active:opacity-70"
          >
            <X size={14} color={colors.error} />
            <Text
              className="text-sm font-medium"
              style={{ color: colors.error }}
            >
              Limpar
            </Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DataList
          className="mx-8 mt-5"
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          emptyMessage={
            selectedDate
              ? "Nenhum registro encontrado nesta data."
              : "Nenhum registro encontrado para este aluno."
          }
          renderItem={({ item }) => {
            const { iconColor, bgColor, IconComponent, subtitle } = getCardVisuals(item);

            return (
              <ListCard
                title={item.title}
                subtitle={subtitle}
                className={
                  item.isResumable
                    ? "border-2 border-primary"
                    : item.hasPendency
                      ? "border-2 border-extra"
                      : ""
                }
                rightActionColor={item.hasPendency ? colors.extra : undefined}
                icon={<IconComponent size={22} color={iconColor} />}
                iconBgColor={bgColor}
                onPress={() => {
                  if (item.isResumable) {
                    router.push({
                      pathname: "/session/structured",
                      params: {
                        sessionId: item.id,
                        studentId: studentId as string,
                        studentName: profile?.name ?? "Aluno",
                        circuitId: item.circuitId ?? "",
                        circuitType: item.circuitType ?? "padrao",
                        circuitName: item.title,
                        exercises: JSON.stringify(
                          (item.resumeExercises ?? []).map((e) => ({
                            id: e.id,
                            name: e.name,
                            description: e.description,
                          })),
                        ),
                      },
                    });
                  } else if (item.type === "mabc") {
                    router.push({
                      pathname: "/mabc2-record-form",
                      params: {
                        mode: "view",
                        studentId: studentId as string,
                        studentName: profile?.name ?? "Aluno",
                        recordId: item.id,
                      },
                    } as any);
                  } else if (item.type === "session") {
                    router.push({
                      pathname: "/history/session-detail",
                      params: {
                        sessionId: item.id,
                        studentId: studentId as string,
                        studentName: profile?.name ?? "Aluno",
                        sessionTitle: item.title,
                      },
                    } as any);
                  } else if (item.type === "form") {
                    router.push({
                      pathname: "/form",
                      params: {
                        mode: "editar",
                        formularioId: item.id,
                        circuitName: item.title,
                        circuitType: item.formType ?? "registro_controle",
                        studentId: studentId as string,
                      },
                    } as any);
                  }
                }}
                enableRipple={true}
                rightAction="chevron"
              />
            );
          }}
        />
      )}

      {showDatePicker && (
        <View className="absolute inset-0 z-50 justify-center px-4 bg-black/50">
          <RangeCalendar
            mode="single"
            onRangeSelected={(date) => {
              setShowDatePicker(false);
              // parseLocalDate evita o bug de fuso horário (new Date("YYYY-MM-DD") é UTC)
              const parsed = parseLocalDate(date);
              setSelectedDate(parsed);
            }}
          />
          {/* Botão opcional para fechar se clicar fora */}
          <Pressable 
              className="mt-4 items-center" 
              onPress={() => setShowDatePicker(false)}
          >
              <Text className="text-white font-bold">Fechar</Text>
          </Pressable>
        </View>
      )}

    </View>
  );
}