import { colors } from "@/assets/colors";
import { DropdownModal } from "@/components/dropdown-modal";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, User, AlertTriangle } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";

export function StudentAnalysisScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { sessions, profile, isLoading } = useStudentSessions(studentId as string);

  const [selectedClassificacao, setSelectedClassificacao] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<View>(null);

  const dropdownOptions = ["Fase 1", "Fase 2", "Fase 3", "Concluído"];

  const handleDropdownPress = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownLayout({
        top: pageY + height,
        left: pageX,
        width: Math.max(width, 140),
      });
      setDropdownVisible(true);
    });
  };

  return (
    <View className="flex-1 bg-level1">
      {/* Cabeçalho de navegação */}
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} className="flex-1">
        <View className="mx-8 mt-5">
          {isLoading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View className="flex-row items-center justify-between border-b border-outline/50 pb-5">
              {/* Perfil e contagem de sessões do aluno */}
              <View className="flex-row items-center flex-1 mr-4">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-level2 mr-3 overflow-hidden">
                  {profile?.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={20} color={colors.muted} />
                  )}
                </View>

                <View className="flex-1 justify-center">
                  <Text className="text-xl font-bold text-white leading-tight" numberOfLines={1}>
                    {profile?.name || "Aluno"}
                  </Text>
                  <Text className="text-sm font-medium text-muted mt-0.5">
                    {sessions.length} {sessions.length === 1 ? "sessão registrada" : "sessões registradas"}
                  </Text>
                </View>
              </View>

              {/* Seletor de Classificação */}
              <View className="items-end">
                <Text className="text-[12px] font-medium text-muted mb-1" style={{ fontFamily: "Inter-Medium" }}>
                  Classificação
                </Text>
                <Pressable
                  ref={buttonRef}
                  onPress={handleDropdownPress}
                  className="flex-row items-center justify-between bg-level2 border border-outline px-3 py-1.5 rounded-lg min-w-[120px] h-[32px] active:opacity-80"
                >
                  <Text className="text-xs text-muted font-medium mr-2" numberOfLines={1}>
                    {selectedClassificacao || "Selecionar"}
                  </Text>
                  <ChevronDown size={14} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Placeholder para futuros componentes adicionais */}
          {!isLoading && (
            <View className="mt-8 items-center justify-center bg-level2 border border-dashed border-outline/80 p-8 rounded-2xl">
              <AlertTriangle size={24} color={colors.muted} />
              <Text className="text-white font-medium text-base mt-2 text-center">
                Visualização de Análises
              </Text>
              <Text className="text-muted text-sm mt-1 text-center max-w-[240px]">
                Novos componentes de análises e progresso de exercícios serão inseridos aqui.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal dropdown de classificação */}
      <DropdownModal
        visible={dropdownVisible}
        onClose={() => setDropdownVisible(false)}
        onSelect={(option) => setSelectedClassificacao(option)}
        options={dropdownOptions}
        selectedValue={selectedClassificacao}
        layout={dropdownLayout}
      />

      {/* Footer */}
      <Footer />
    </View>
  );
}
