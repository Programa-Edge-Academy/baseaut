import { colors } from "@/assets/colors";
import { AppModal } from "@/components/app-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Toast } from "@/components/toast";
import {
  ActivityRecordCard,
  type ActivityRecordUpdate,
} from "@/features/sessions/components/activity-record-card";
import { useSessionDetail } from "@/features/sessions/hooks/use-session-detail";
import { exportSession } from "@/features/sessions/utils/export-session";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SessionDetailScreen() {
  const { sessionId, studentName, sessionTitle } =
    useLocalSearchParams<{
      sessionId: string;
      studentName: string;
      sessionTitle?: string;
    }>();

  const safeName = studentName || "Aluno";
  const { data, isLoading, error, updateExecution, deleteSession } =
    useSessionDetail(sessionId as string, sessionTitle);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormatPickerOpen, setIsFormatPickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    mode: "success" | "error";
    title: string;
    description?: string;
  }>({ visible: false, mode: "error", title: "" });

  async function handleSaveExecution(
    execId: string,
    values: ActivityRecordUpdate,
  ) {
    try {
      await updateExecution(execId, values);
      setToastConfig({
        visible: true,
        mode: "success",
        title: "Registro atualizado com sucesso",
      });
    } catch {
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Não foi possível atualizar o registro.",
        description: "Tente novamente",
      });
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteSession();
      router.back();
    } catch {
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Não foi possível remover a sessão.",
        description: "Tente novamente",
      });
    }
  }

  async function handleExport(formats: { pdf: boolean; csv: boolean }) {
    if (!data) return;
    setIsFormatPickerOpen(false);
    setIsExporting(true);
    try {
      await exportSession(
        {
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          studentName: safeName,
          executions: data.executions,
        },
        formats,
      );
      setToastConfig({ visible: true, mode: "success", title: "Exportado com sucesso" });
    } catch (err: any) {
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Erro ao exportar",
        description: err?.message,
      });
    } finally {
      setIsExporting(false);
    }
  }

  const title = data
    ? `${data.sessionTitle} - ${safeName}`
    : sessionTitle
      ? `${sessionTitle} - ${safeName}`
      : `Sessão - ${safeName}`;

  const subtitle = data?.sessionDate ?? "";

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <View className="mx-8 mt-5">
        <PageHeader
          title={title}
          subtitle={subtitle}
          mode="historico-estudante"
          onSharePress={() => setIsFormatPickerOpen(true)}
          onDeletePress={() => setIsDeleteModalVisible(true)}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-white">
            {error.message || "Erro ao carregar a sessão."}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="mt-5 px-8"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {(data?.executions ?? []).length === 0 ? (
            <Text className="mt-10 text-center text-muted">
              Nenhum exercício registrado nesta sessão.
            </Text>
          ) : (
            (data?.executions ?? []).map((exec) => (
              <ActivityRecordCard
                key={exec.id}
                record={exec}
                onSave={handleSaveExecution}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Format picker */}
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
          <FormatPicker
            onExport={handleExport}
            onClose={() => setIsFormatPickerOpen(false)}
          />
        </Pressable>
      </AppModal>

      <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDelete}
        title="Remover sessão?"
        message="Esta sessão será removida do histórico permanentemente."
        confirmLabel={isDeleting ? "Removendo..." : "Remover"}
        cancelLabel="Cancelar"
        iconType="alert"
      />

      <Toast
        visible={toastConfig.visible || isExporting}
        mode={isExporting ? "success" : toastConfig.mode}
        title={isExporting ? "Exportando..." : toastConfig.title}
        description={isExporting ? undefined : toastConfig.description}
        onHide={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

function FormatPicker({
  onExport,
  onClose,
}: {
  onExport: (f: { pdf: boolean; csv: boolean }) => void;
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
          onPress={() => onExport({ pdf, csv })}
          sizeClass="flex-1 h-11"
          bgColorClass="bg-primary"
          hasShadow
        />
      </View>
    </Pressable>
  );
}
