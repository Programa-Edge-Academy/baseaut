import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { colors } from "@/assets/colors";
import { AppModal } from "@/components/app-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import { FormComponent } from "@/features/forms/components/form-component";
import { PageHeader } from "@/components/page-header";
import { Toast, ToastMode } from "@/components/toast";
import { useGlobalToast } from "@/components/global-toast";
import { exportForm } from "@/features/forms/utils/export-form";
import { supabase } from "@/lib/supabase";

const FORM_SUBTITLES: Record<string, string> = {
  ata: "Pontue conforme os indicadores observados",
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
  // Evita criar instâncias ATA/CARS/MABC duplicadas em re-renders.
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

      // 5. Fallback genérico: template global resolvido por tipo.
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
  const { showToast } = useGlobalToast();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormatPickerOpen, setIsFormatPickerOpen] = useState(false);
  // Exportação só faz sentido para ATA/CARS (RC vai junto com a sessão).
  const isAtaCars = circuitType === "ata" || circuitType === "cars";
  const [toastConfig, setToastConfig] = useState<{visible: boolean, mode: ToastMode, title: string, description?: string}>({
    visible: false,
    mode: "success",
    title: ""
  });

  const handleSaveForm = async () => {
    // Impede salvar enquanto a instância ainda está sendo resolvida/carregada
    // (evita gravar um formulário sem respostas).
    if (resolvingForm || !formId) return;
    if (formRef.current) {
      const result = await formRef.current.handleSave(true);

      if (result && result.success) {
        // Navega primeiro; o toast de sucesso é global e aparece na tela seguinte.
        router.back();
        showToast({
          mode: "success",
          title: "Formulário salvo",
          description: "As respostas foram salvas com sucesso!",
        });
      } else if (result) {
        // Erros mantêm o toast local (o usuário permanece na tela do formulário).
        setToastConfig({
          visible: true,
          mode: "error",
          title: result.title || "Erro ao salvar",
          description: result.description
        });
      }
    }
  };

  const handleDeleteForm = async () => {
    if (!formId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("formularios")
        .update({ ativo: false })
        .eq("id", formId);
      if (error) throw error;
      router.back();
    } catch {
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Não foi possível remover o formulário.",
        description: "Tente novamente",
      });
    }
  };

  const handleExportForm = async (
    formats: { pdf: boolean; csv: boolean },
    deliveryMode: "share" | "download" = "share",
  ) => {
    if (!formId) return;
    setIsFormatPickerOpen(false);
    try {
      await exportForm(
        {
          formularioId: formId,
          title: String(circuitName || circuitType || "Formulário"),
          studentName: "Aluno",
        },
        formats,
        deliveryMode,
      );
    } catch (err: any) {
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Erro ao exportar",
        description: err?.message,
      });
    }
  };

  const handleToastHide = () => {
    // O toast local agora só exibe erros (o sucesso usa o toast global após
    // navegar), então aqui basta ocultá-lo.
    setToastConfig((prev) => ({ ...prev, visible: false }));
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
              // O RC (registro_controle) é vinculado à sessão — pode ser editado,
              // mas não excluído isoladamente; por isso não exibe o lixo.
              mode={isEditing && !isRegistroControle ? "historico-estudante" : undefined}
              onSharePress={
                isEditing && isAtaCars ? () => setIsFormatPickerOpen(true) : undefined
              }
              onDeletePress={
                isEditing && !isRegistroControle
                  ? () => setIsDeleteModalVisible(true)
                  : undefined
              }
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

      <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDeleteForm}
        title="Remover formulário?"
        message="Este formulário será removido do histórico permanentemente."
        confirmLabel={isDeleting ? "Removendo..." : "Remover"}
        cancelLabel="Cancelar"
        iconType="alert"
      />

      <AppModal
        visible={isFormatPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFormatPickerOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => setIsFormatPickerOpen(false)}
        >
          <FormFormatPicker
            onExport={handleExportForm}
            onClose={() => setIsFormatPickerOpen(false)}
          />
        </Pressable>
      </AppModal>

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

function FormFormatPicker({
  onExport,
  onClose,
}: {
  onExport: (f: { pdf: boolean; csv: boolean }, mode: "share" | "download") => void;
  onClose: () => void;
}) {
  const [pdf, setPdf] = useState(true);
  const [csv, setCsv] = useState(false);

  return (
    <Pressable
      className="bg-level2 border border-outline rounded-2xl p-6 w-full gap-5"
      onPress={(e) => e.stopPropagation()}
    >
      <Text className="text-header-2 text-white">Selecionar formato</Text>

      <View className="gap-3">
        <Pressable onPress={() => setPdf((v) => !v)} className="flex-row items-center gap-3">
          <View
            className={`w-5 h-5 rounded border items-center justify-center ${pdf ? "bg-primary border-primary" : "border-outline bg-transparent"}`}
          >
            {pdf && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-white text-default-1">PDF</Text>
        </Pressable>

        <Pressable onPress={() => setCsv((v) => !v)} className="flex-row items-center gap-3">
          <View
            className={`w-5 h-5 rounded border items-center justify-center ${csv ? "bg-primary border-primary" : "border-outline bg-transparent"}`}
          >
            {csv && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-white text-default-1">CSV (dados tabulares)</Text>
        </Pressable>
      </View>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <DefaultButton
            label="Cancelar"
            onPress={onClose}
            bgColorClass="bg-level1"
            shadowClass=""
            sizeClass="flex-1 h-11"
            className="border border-outline"
            textClassName="text-muted"
          />
          <DefaultButton
            label="Exportar"
            onPress={() => onExport({ pdf, csv }, "share")}
            sizeClass="flex-1 h-11"
            bgColorClass="bg-primary"
            hasShadow
          />
        </View>

        {Platform.OS === "android" && (
          <DefaultButton
            label="Apenas baixar"
            onPress={() => onExport({ pdf, csv }, "download")}
            sizeClass="w-full h-11"
            bgColorClass="bg-level1"
            isOutline={true}
            outlineBorderClass="border-outline"
            hasShadow={false}
            className="border border-outline"
            textClassName="text-white"
          />
        )}
      </View>
    </Pressable>
  );
}