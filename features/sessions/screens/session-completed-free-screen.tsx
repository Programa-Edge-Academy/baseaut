import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SessionCompletion } from "@/features/exercises/components/session-completion";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

import type { SessionCompletedScreenProps } from "./session-completed-structured-screen";

export function SessionCompletedFreeScreen({
  studentName = "Aluno",
  circuitName = "Circuito",
  modeLabel = "Livre",
  details,
  progress = "0 atividades realizadas",
  statusLabel = "",
  unrealizedCount = 0,
}: SessionCompletedScreenProps) {
  const router = useRouter();
  const resolvedDetails =
    details ?? `${studentName} · ${circuitName} · ${modeLabel}`;

  return (
    <View className="flex-1 bg-level1">
      <ScrollView>
        <View>
          <Header variant="back" />

          <View className="left-6 top-[2%] w-[264px]">
            <PageHeader
              title={`Sessão de ${studentName}`}
              subtitle={`${circuitName} · ${modeLabel}`}
            />
          </View>
          <View className="top-[5%] mx-5 rounded-2xl bg-level1 p-5 justify-center items-center">
            <SessionCompletion
              details={resolvedDetails}
              className=""
              statusLabel={statusLabel}
              hasWarnings={false}
              unrealizedCount={unrealizedCount}
              onBackToStart={() => router.replace("/students")}
              progress={progress}
              onSelectContinuation={() => router.replace("/students")}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
