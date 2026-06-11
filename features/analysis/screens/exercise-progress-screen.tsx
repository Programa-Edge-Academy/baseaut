import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export function ExerciseProgressScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { profile, isLoading } = useStudentSessions(studentId as string);

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} className="flex-1">
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-5">
            <Text
              className="text-xl font-bold text-white"
              style={{ marginHorizontal: 22, marginBottom: 16, fontFamily: "Inter-Bold" }}
            >
              Progresso por exercício - {profile?.name || "Aluno"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default ExerciseProgressScreen;
