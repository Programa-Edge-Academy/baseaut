import React from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "@/components/header";
import { FormComponent } from "@/features/forms/components/form-component";
import { PageHeader } from "@/components/page-header";

export default function FormCarsRoute() {
  const { studentName, circuitName, sessionId, studentId } = useLocalSearchParams<any>();
  const formId = "5b6d718f-23fe-49ad-90ec-3dd2416b4d71";
  const sessaoAtualId = sessionId || "";
  const alunoSelecionadoId = studentId || "";

  return (
    <>
      <View className="flex-1 bg-level1">
        {/* Still needs a new Header type to Save or go Back */}
        <Header variant="back" onPressBack={() => router.back()} />
        <View className="flex-1 mx-8">
          <View className="mt-5 w-full">
            <PageHeader
            title="Preencher formulário CARS"
            subtitle="Arraste o marcador para definir a pontuação"
            />
          </View>
          <ScrollView className="mt-3">
            <FormComponent
              formularioId={formId}
              sessaoId={sessaoAtualId}
              alunoId={alunoSelecionadoId}
            />
          </ScrollView>
        </View>
      </View>
    </>
  );
}