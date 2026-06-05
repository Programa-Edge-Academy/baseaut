import React, { useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "@/components/header";
import { FormComponent } from "@/features/forms/components/form-component";
import { PageHeader } from "@/components/page-header";
import { Toast, ToastMode } from "@/components/toast";

export default function FormRoute() {
  const { studentName, circuitType, circuitName, sessionId, studentId } = useLocalSearchParams<any>();
  const formId = circuitType === "ata" ? "c5f4ea9a-1a96-46aa-9b2b-9d6ee8b4025f" : circuitType === "cars" ? "5b6d718f-23fe-49ad-90ec-3dd2416b4d71" : "";
  const sessaoAtualId = sessionId || "";
  const alunoSelecionadoId = studentId || "";

  const formRef = useRef<any>(null);
  const [toastConfig, setToastConfig] = useState<{visible: boolean, mode: ToastMode, title: string, description?: string}>({
    visible: false,
    mode: "success",
    title: ""
  });

  const handleSaveForm = async () => {
    if (formRef.current) {
      const result = await formRef.current.handleSave(true);
      
      if (result && result.success) {
        setToastConfig({
          visible: true,
          mode: "success",
          title: "Formulário salvo",
          description: "As respostas foram salvas com sucesso!"
        });
      } else if (result) {
        setToastConfig({
          visible: true,
          mode: "error",
          title: result.title || "Erro ao salvar",
          description: result.description
        });
      }
    }
  };

  const handleToastHide = () => {
    if (toastConfig.mode === "success") {
      router.back();
    } else {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }
  };

  return (
    <>
      <View className="flex-1 bg-level1">
        <Header 
          variant="form" 
          onPressBack={() => router.back()} 
          onPressSave={handleSaveForm} 
        />
        <View className="flex-1 mx-8">
          <View className="mt-5 w-full">
            <PageHeader
              title={"Preencher formulário " + circuitName}
              subtitle={circuitType === "ata" ? "Marque as caixas para preencher o formulário" : circuitType === "cars" ? "Arraste o marcador para definir a pontuação" : ""}
            />
          </View>
          <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
            <FormComponent
              ref={formRef}
              formularioId={formId}
              sessaoId={sessaoAtualId}
              alunoId={alunoSelecionadoId}
            />
          </ScrollView>
        </View>
      </View>

      <Toast
        visible={toastConfig.visible}
        mode={toastConfig.mode}
        title={toastConfig.title}
        description={toastConfig.description}
        onHide={handleToastHide}
      />
    </>
  );
}