import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { ContinuationOptions } from "@/features/exercises/components/continuation-options";
import { SessionCompletion } from "@/features/exercises/components/session-completion";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

import type { SessionCompletedScreenProps } from "./session-completed-structured-screen";

export function SessionCompletedStructuredContinuationScreen({
  studentName = "Aluno",
  circuitName = "Circuito",
  modeLabel = "Estruturado",
  details,
  progress = "0/0",
  statusLabel = "Realizadas",
  unrealizedCount = 0,
}: SessionCompletedScreenProps) {
  const router = useRouter();
  const resolvedDetails =
    details ?? `${studentName} · ${circuitName} · ${modeLabel}`;

  const backToStart = () => router.replace("/students");

  return (
    <View className="flex-1 bg-level1">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <Header variant="back" />

          <View className="left-6 top-[2%] w-[264px]">
            <PageHeader
              title={`Sessão de ${studentName}`}
              subtitle={`${circuitName} · ${modeLabel}`}
            />
          </View>

          {/* Cartão de Conclusão */}
          <View className="top-[5%] mx-5 rounded-2xl bg-level1 p-5 justify-center items-center">
            <SessionCompletion
              details={resolvedDetails}
              className=""
              statusLabel={statusLabel}
              hasWarnings={false}
              unrealizedCount={unrealizedCount}
              onBackToStart={backToStart}
              onSelectContinuation={backToStart}
              progress={progress}
            />
          </View>

          {/* Opções de Continuação */}
          <View className="top-[8%] mx-5 rounded-2xl justify-center items-center">
            <ContinuationOptions
              unrealizedCount={unrealizedCount}
              onSelectOption={backToStart}
              onCancel={backToStart}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
