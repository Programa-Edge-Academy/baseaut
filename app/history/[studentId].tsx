import { useLocalSearchParams } from "expo-router";
import { ClipboardList, Route, X } from "lucide-react-native"; 
import React, { useState, useMemo } from "react"; 
import { ActivityIndicator, Pressable, Text, View } from "react-native"; 
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker"; 

import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { withOpacity } from "@/components/color-opacity";

export default function HistoryDetailsScreen() {
  const { studentId } = useLocalSearchParams();
  const { sessions, profile, isLoading } = useStudentSessions(
    studentId as string,
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filtro de data única e fechamento do modal
  const onChangeDate = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && date) {
      setSelectedDate(date); 
    }
  };

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions;

    const formattedFilterDate = selectedDate.toLocaleDateString("pt-BR");
    return sessions.filter((item) => item.date === formattedFilterDate);
  }, [selectedDate, sessions]);

  // Auxiliar para definir propriedades visuais do card
  const getCardVisuals = (item: any) => {
    switch (item.type) {
      case "form":
        return {
          iconColor: colors.primary, // Azul
          bgColor: withOpacity(colors.primary, 0.15),
          IconComponent: ClipboardList,
          subtitle: item.date,
        };
      case "session":
        return {
          iconColor: colors.secondary, // Verde
          bgColor: withOpacity(colors.secondary, 0.15),
          IconComponent: Route,
          subtitle: `${item.date} · ${item.status}`,
        };
      case "mabc": {
        const age = item.ageAtEvent || 0;
        let mabcColor = "#A179FF"; // Roxo padrão (11-16 anos)
        if (age >= 3 && age <= 6) {
          mabcColor = "#f97316"; // Laranja
        } else if (age >= 7 && age <= 10) {
          mabcColor = colors.secondary; // Verde Claro
        }

        return {
          iconColor: mabcColor,
          bgColor: `${mabcColor}26`, // Cor com 15% de opacidade em hex
          IconComponent: Route,
          subtitle: `${item.date} · Idade: ${age} anos`,
        };
      }
      default:
        return {
          iconColor: colors.primary,
          bgColor: `${colors.primary}26`,
          IconComponent: ClipboardList,
          subtitle: item.date,
        };
    }
  };

  return (
    <View className="flex-1 bg-level1">
      <Header />

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
            <Text className="text-sm font-medium" style={{ color: colors.error }}>
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
                className={item.hasPendency ? "border-2 border-extra" : ""}
                icon={<IconComponent size={22} color={iconColor} />}
                iconBgColor={bgColor}
                onPress={() => {
                  console.log(`Abrindo detalhes do ${item.type}: ${item.id}`);
                }}
                enableRipple={true}
                rightAction="chevron"
              />
            );
          }}
        />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} 
        />
      )}

      <Footer />
    </View>
  );
}