import React from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "@/components/header";
import { FormComponent } from "@/features/forms/components/form-component";
import { PageHeader } from "@/components/page-header";

export default function FormAtaRoute() {
  const { studentName, circuitName, sessionId, studentId } = useLocalSearchParams<any>();
  const formId = "c5f4ea9a-1a96-46aa-9b2b-9d6ee8b4025f";
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
            title="Preencher formulário ATA"
            subtitle="Marque as caixas para preencher o formulário"
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