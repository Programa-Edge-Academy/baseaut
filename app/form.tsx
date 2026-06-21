import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { FormComponent } from "@/features/forms/components/form-component";
import { PageHeader } from "@/components/page-header";
import { Toast, ToastMode } from "@/components/toast";
import { supabase } from "@/lib/supabase";

const FORM_SUBTITLES: Record<string, string> = {
  ata: "Marque as caixas para preencher o formulário",
  cars: "Arraste o marcador para definir a pontuação",
  registro_controle: "Preencha o registro de controle da sessão",
  rc: "Preencha o registro de controle da sessão",
  mabc2: "Preencha os itens da avaliação MABC-2",
};

/**
 * Resolve o template global (aluno_id NULL) de um tipo de formulário pelo tipo,
 * sem depender de IDs fixos no código. Usado apenas como fallback de leitura.
 */
async function resolveTemplateId(tipo: string): Promise<string | null> {
  const { data } = await supabase
    .from("formularios")
    .select("id")
    .eq("tipo", tipo)
    .is("aluno_id", null)
    .order("protegido", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export default function FormRoute() {
  const {
    circuitType,
    circuitName,
    sessionId,
    studentId,
    mode,
    formularioId: formularioIdParam,
  } = useLocalSearchParams<any>();
  const sessaoAtualId = sessionId || "";
  const alunoSelecionadoId = studentId || "";
  const isEditing = mode === "editar";
  // RC é vinculado à sessão; ATA/CARS, ao aluno.
  const isRegistroControle =
    circuitType === "registro_controle" || circuitType === "rc";

  // Instância real do formulário (não o template global) a ser preenchida.
  const [formId, setFormId] = useState<string | null>(
    formularioIdParam ?? null,
  );
  const [resolvingForm, setResolvingForm] = useState(true);
  // Evita criar instâncias ATA/CARS duplicadas em re-renders.
  const creatingInstanceRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function resolveFormInstance() {
      // 1. Instância explícita (ex.: edição vinda do histórico).
      if (formularioIdParam) {
        if (active) {
          setFormId(formularioIdParam);
          setResolvingForm(false);
        }
        return;
      }

      // 2. Registro de Controle: usa a instância criada por trigger na sessão.
      if (isRegistroControle) {
        let instanceId: string | null = null;

        if (sessaoAtualId) {
          const { data } = await supabase
            .from("sessoes")
            .select("formulario_id")
            .eq("id", sessaoAtualId)
            .maybeSingle();
          instanceId = data?.formulario_id ?? null;
        }

        // Fallback de leitura: template do RC resolvido por tipo.
        if (!instanceId) {
          instanceId = await resolveTemplateId("registro_controle");
        }

        if (active) {
          setFormId(instanceId);
          setResolvingForm(false);
        }
        return;
      }

      // 3. ATA/CARS: cria uma nova instância por registro (uma única vez).
      if (
        (circuitType === "ata" || circuitType === "cars") &&
        alunoSelecionadoId
      ) {
        if (creatingInstanceRef.current) return;
        creatingInstanceRef.current = true;

        const { data, error } = await supabase.rpc("criar_nova_avaliacao", {
          p_aluno_id: alunoSelecionadoId,
          p_tipo: circuitType,
        });

        const fallback = error ? await resolveTemplateId(circuitType) : null;

        if (active) {
          setFormId(error ? fallback : data);
          setResolvingForm(false);
        }
        return;
      }

      // 4. MABC-2: cria instância via rpc_iniciar_mabc2 (determina faixa pela idade).
      if (circuitType === "mabc2" && alunoSelecionadoId) {
        if (creatingInstanceRef.current) return;
        creatingInstanceRef.current = true;

        const { data: userData } = await supabase.auth.getUser();
        const avaliadorId = userData?.user?.id ?? null;

        if (!avaliadorId) {
          if (active) { setFormId(null); setResolvingForm(false); }
          return;
        }

        const { data, error } = await supabase.rpc("rpc_iniciar_mabc2", {
          p_aluno_id: alunoSelecionadoId,
          p_avaliador_id: avaliadorId,
        });

        const fallback = error ? await resolveTemplateId("mabc2") : null;

        if (active) {
          setFormId(error ? fallback : (data?.formulario_id ?? null));
          setResolvingForm(false);
        }
        return;
      }

      // 4. Fallback genérico: template global resolvido por tipo.
      if (active) {
        const fallbackId = await resolveTemplateId(circuitType);
        setFormId(fallbackId);
        setResolvingForm(false);
      }
    }

    resolveFormInstance();
    return () => {
      active = false;
    };
  }, [
    circuitType,
    sessaoAtualId,
    alunoSelecionadoId,
    formularioIdParam,
    isRegistroControle,
  ]);

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
            {resolvingForm || !formId ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FormComponent
                ref={formRef}
                formularioId={formId}
                sessaoId={isRegistroControle ? sessaoAtualId : ""}
                alunoId={isRegistroControle ? "" : alunoSelecionadoId}
              />
            )}
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