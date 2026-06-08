import React, { useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Header } from "@/components/header";
import { FormComponent } from "@/features/forms/components/form-component";
import { PageHeader } from "@/components/page-header";
import { Toast, ToastMode } from "@/components/toast";

// IDs dos templates globais de formulário (seeds do banco).
const FORM_TEMPLATE_IDS: Record<string, string> = {
  ata: "c5f4ea9a-1a96-46aa-9b2b-9d6ee8b4025f",
  cars: "5b6d718f-23fe-49ad-90ec-3dd2416b4d71",
  registro_controle: "00000000-0000-4000-0000-0000000000fc",
  rc: "00000000-0000-4000-0000-0000000000fc",
};

const FORM_SUBTITLES: Record<string, string> = {
  ata: "Marque as caixas para preencher o formulário",
  cars: "Arraste o marcador para definir a pontuação",
  registro_controle: "Preencha o registro de controle da sessão",
  rc: "Preencha o registro de controle da sessão",
};

export default function FormRoute() {
  const { studentName, circuitType, circuitName, sessionId, studentId, mode } =
    useLocalSearchParams<any>();
  const formId = FORM_TEMPLATE_IDS[circuitType] ?? "";
  const sessaoAtualId = sessionId || "";
  const alunoSelecionadoId = studentId || "";
  const isEditing = mode === "editar";

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
              title={
                (isEditing ? "Editar formulário " : "Preencher formulário ") +
                circuitName
              }
              subtitle={FORM_SUBTITLES[circuitType] ?? ""}
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