import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Stopwatch } from "@/features/exercises/components/stopwatch";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

export function EngagementActivityRunningScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-level1">
      <ScrollView >

        <Header variant="finishEngagement" onPressBack={() => router.replace("/students")} />

        <View className="left-6 top-[2%] w-[264px]">
          <PageHeader title="Sessão de Lucas" subtitle="Circuito 2 · Exercício 1" />
        </View>

        {/* Main panel with actions */}
        <View className="top-[4%] p-5 rounded-2xl w-[100%] justify-center align-center">
          <Stopwatch title={"Atividade de engajamento"} subtitle={"Momento focado na interação com o aluno"} onToggleRunning={function (isRunning: boolean): void {
          }} onStop={function (seconds: number): void {}} onPressCrise={function (): void {}} variant="minimize" className="bg-level2" />
        </View>
        
      </ScrollView>
    </View>
  );
}

export default EngagementActivityRunningScreen;
