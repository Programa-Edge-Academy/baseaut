import { colors } from "@/assets/colors";
import { AppModal } from "@/components/app-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { type ToastMode } from "@/components/toast";
import type { Mabc2SectionProps } from "@/features/analysis/components/mabc2-section";
import {
  deleteMabc2Record,
  getMabc2Record,
  saveMabc2Record,
  startMabc2Record,
  type Mabc2Draft,
} from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordFormScreen } from "@/features/analysis/screens/mabc2-record-form-screen";
import { exportMabc } from "@/features/analysis/utils/export-mabc";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type ScreenMode = "create" | "view" | "edit";

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function Mabc2RecordFormRoute() {
  const { mode, studentId, studentName, recordId } = useLocalSearchParams<{
    mode?: ScreenMode;
    studentId: string;
    studentName: string;
    recordId?: string;
  }>();

  const currentMode = mode ?? "create";
  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? "Aluno";
  const currentRecordId = recordId ?? "";

  const navigation = useNavigation();
  const isAbortedRef = useRef(false);
  const createdIdRef = useRef<string | null>(null);
  const shouldBypassExit = useRef(false);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Mabc2Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exitAction, setExitAction] = useState<any>(null);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [isFormatPickerOpen, setIsFormatPickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    mode: ToastMode;
    title: string;
    description?: string;
  }>({
    visible: false,
    mode: "error",
    title: "",
  });
  const hasLoaded = useRef(false);

  useEffect(() => {
    return () => {
      isAbortedRef.current = true;
    };
  }, []);

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAuthorized(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("perfis")
          .select("perfil")
          .eq("id", user.id)
          .single();

        const role = profileData?.perfil || user.user_metadata?.perfil || user.user_metadata?.role;

        if (role === "coordenador" || role === "monitor") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAuthorized === false) {
      router.back();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized || hasLoaded.current) return;
    hasLoaded.current = true;

    async function load() {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        if (currentMode === "create") {
          const created = await startMabc2Record(currentStudentId);
          if (isAbortedRef.current) {
            deleteMabc2Record(created.formularioId).catch(() => {});
            return;
          }
          createdIdRef.current = created.formularioId;
          setDraft(created);
        } else if (currentRecordId) {
          const existing = await getMabc2Record(currentRecordId);
          if (isAbortedRef.current) return;
          setDraft(existing);
        } else {
          throw new Error("Registro não informado.");
        }
      } catch {
        if (isAbortedRef.current) return;
        setLoadFailed(true);
        setToastConfig({
          visible: true,
          mode: "error",
          title: "Não foi possível carregar os dados de desenvolvimento motor.",
          description: "Tente novamente",
        });
      } finally {
        if (!isAbortedRef.current) {
          setIsLoading(false);
        }
      }
    }

    load();
  }, [currentMode, currentStudentId, currentRecordId, isAuthorized]);

  const handleDiscardAndLeave = async (action?: any) => {
    if (currentMode === "create" && createdIdRef.current) {
      try {
        await deleteMabc2Record(createdIdRef.current);
      } catch {}
    }
    
    shouldBypassExit.current = true;
    if (action) {
      navigation.dispatch(action);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (currentMode === "view" || shouldBypassExit.current) {
        return;
      }

      e.preventDefault();

      if (isDirty) {
        setExitAction(e.data.action);
        setIsExitModalVisible(true);
      } else {
        handleDiscardAndLeave(e.data.action);
      }
    });

    return unsubscribe;
  }, [navigation, isDirty, currentMode]);

  const sections: Mabc2SectionProps[] = useMemo(() => {
    if (!draft) return [];

    return draft.sections.map((section, sectionIndex) => ({
      ...section,
      onChangeCategoryScore: (value) => {
        setIsDirty(true);
        setDraft((current) =>
          current
            ? {
                ...current,
                sections: current.sections.map((item, index) =>
                  index === sectionIndex
                    ? { ...item, categoryScore: parseNumber(value) }
                    : item
                ),
              }
            : current
        );
      },
      onChangeCategoryPercentile: (value) => {
        setIsDirty(true);
        setDraft((current) =>
          current
            ? {
                ...current,
                sections: current.sections.map((item, index) =>
                  index === sectionIndex
                    ? { ...item, categoryPercentile: value.trim() || null }
                    : item
                ),
              }
            : current
        );
      },
      exercises: section.exercises.map((exercise, exerciseIndex) => ({
        ...exercise,
        onChangeAttemptCount: (value) => {
          setIsDirty(true);
          setDraft((current) =>
            current
              ? {
                  ...current,
                  sections: current.sections.map((item, index) =>
                    index === sectionIndex
                      ? {
                          ...item,
                          exercises: item.exercises.map(
                            (currentExercise, currentExerciseIndex) =>
                              currentExerciseIndex === exerciseIndex
                                ? {
                                    ...currentExercise,
                                    attemptCount: parseNumber(value),
                                  }
                                : currentExercise
                          ),
                        }
                      : item
                  ),
                }
              : current
          );
        },
        onChangeScore: (value) => {
          setIsDirty(true);
          setDraft((current) =>
            current
              ? {
                  ...current,
                  sections: current.sections.map((item, index) =>
                    index === sectionIndex
                      ? {
                          ...item,
                          exercises: item.exercises.map(
                            (currentExercise, currentExerciseIndex) =>
                              currentExerciseIndex === exerciseIndex
                                ? {
                                    ...currentExercise,
                                    score: parseNumber(value),
                                  }
                                : currentExercise
                          ),
                        }
                      : item
                  ),
                }
              : current
          );
        },
      })),
    }));
  }, [draft]);

  const recordCount = draft?.sections.length ?? 0;

  function validateDraft(draftData: Mabc2Draft) {
    if (draftData.totalScore === null || draftData.totalScore as any === "") return false;
    if (draftData.totalPercentile === null || draftData.totalPercentile.trim() === "") return false;

    for (const section of draftData.sections) {
      if (section.categoryScore === null || section.categoryScore as any === "") return false;
      if (section.categoryPercentile === null || section.categoryPercentile.trim() === "") return false;

      for (const exercise of section.exercises) {
        if (exercise.score === null || exercise.score as any === "") return false;
        if (exercise.attemptCount === null || exercise.attemptCount as any === "") return false;
      }
    }
    return true;
  }

  async function handleSave() {
    if (!draft || isSubmitting) return;

    if (!validateDraft(draft)) {
      setShowErrors(true);
      setToastConfig({
        visible: true,
        mode: "error",
        title: `Preencha os campos obrigatórios para ${currentMode === "edit" ? "salvar" : "registrar"} a avaliação`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await saveMabc2Record(draft);
      shouldBypassExit.current = true;
      router.replace({
        pathname: "/mabc2-records",
        params: {
          studentId: currentStudentId,
          studentName: currentStudentName,
          toastSuccess:
            currentMode === "edit"
              ? "Registro editado com sucesso"
              : "Registro salvo com sucesso",
        },
      } as any);
    } catch {
      setIsSubmitting(false);
      setToastConfig({
        visible: true,
        mode: "error",
        title:
          currentMode === "edit"
            ? "Não foi possível editar o registro."
            : "Não foi possível salvar o registro.",
        description: "Tente novamente",
      });
    }
  }

  async function handleExport(formats: { pdf: boolean; csv: boolean }) {
    if (!draft) return;
    setIsFormatPickerOpen(false);
    setIsExporting(true);
    try {
      await exportMabc(draft, formats, currentStudentName);
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

  async function handleDelete() {
    const targetRecordId = currentRecordId || draft?.formularioId;
    if (!targetRecordId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await deleteMabc2Record(targetRecordId);
      shouldBypassExit.current = true;
      router.replace({
        pathname: "/mabc2-records",
        params: {
          studentId: currentStudentId,
          studentName: currentStudentName,
          toastSuccess: "Registro excluído com sucesso",
        },
      } as any);
    } catch {
      setIsSubmitting(false);
      setToastConfig({
        visible: true,
        mode: "error",
        title: "Não foi possível excluir o registro.",
        description: "Tente novamente",
      });
    }
  }

  if (isAuthorized === null || (isAuthorized && isLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-level1">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthorized === false) {
    return null;
  }

  if (loadFailed || !draft) {
    return (
      <View className="flex-1 bg-level1">
        <Mabc2RecordFormScreen
          studentName={currentStudentName}
          recordCount={0}
          totalScore={null}
          totalPercentile={null}
          sections={[]}
          readOnly
          toastConfig={toastConfig}
          onHideToast={() => {
            setToastConfig((prev) => ({ ...prev, visible: false }));
            shouldBypassExit.current = true;
            router.back();
          }}
          onPressBack={() => router.back()}
        />
      </View>
    );
  }

  return (
    <>
      <Mabc2RecordFormScreen
        studentName={currentStudentName}
        recordCount={recordCount}
        totalScore={draft.totalScore}
        totalPercentile={draft.totalPercentile}
        sections={sections}
        readOnly={currentMode === "view"}
        showErrors={showErrors}
        submitLabel={currentMode === "edit" ? "Salvar" : "Registrar"}
        toastConfig={toastConfig}
        onHideToast={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
        onChangeTotalScore={(value) => {
          setIsDirty(true);
          setDraft((current) =>
            current ? { ...current, totalScore: parseNumber(value) } : current
          );
        }}
        onChangeTotalPercentile={(value) => {
          setIsDirty(true);
          setDraft((current) =>
            current
              ? { ...current, totalPercentile: value.trim() || null }
              : current
          );
        }}
        onPressBack={() => router.back()}
        onRegister={handleSave}
        onShare={currentMode === "view" ? () => setIsFormatPickerOpen(true) : undefined}
        onEdit={() => {
          shouldBypassExit.current = true;
          router.replace({
            pathname: "/mabc2-record-form",
            params: {
              mode: "edit",
              studentId: currentStudentId,
              studentName: currentStudentName,
              recordId: currentRecordId || draft.formularioId,
            },
          } as any);
        }}
        onDelete={handleDelete}
      />

      <ConfirmationModal
        visible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
        onConfirm={() => {
          setIsExitModalVisible(false);
          handleDiscardAndLeave(exitAction);
        }}
        title="Você tem certeza que deseja sair?"
        message="Os dados preenchidos serão perdidos."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        iconType="alert"
      />

      {/* Format picker */}
      <AppModal
        visible={isFormatPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFormatPickerOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}
          onPress={() => setIsFormatPickerOpen(false)}
        >
          <MabcFormatPicker
            onExport={handleExport}
            onClose={() => setIsFormatPickerOpen(false)}
          />
        </Pressable>
      </AppModal>
    </>
  );
}

function MabcFormatPicker({
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
      style={{
        backgroundColor: colors.level2,
        borderWidth: 1,
        borderColor: colors.outline,
        borderRadius: 16,
        padding: 24,
        width: "100%",
        gap: 20,
      }}
      onPress={(e) => e.stopPropagation()}
    >
      <Text style={{ color: "#fff", fontSize: 18, fontFamily: "Inter-Bold" }}>
        Selecionar formato
      </Text>

      <View style={{ gap: 12 }}>
        <Pressable onPress={() => setPdf((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 20, height: 20, borderRadius: 4, borderWidth: 1,
              alignItems: "center", justifyContent: "center",
              backgroundColor: pdf ? colors.primary : "transparent",
              borderColor: pdf ? colors.primary : colors.outline,
            }}
          >
            {pdf && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>✓</Text>}
          </View>
          <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter-Medium" }}>PDF</Text>
        </Pressable>

        <Pressable onPress={() => setCsv((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 20, height: 20, borderRadius: 4, borderWidth: 1,
              alignItems: "center", justifyContent: "center",
              backgroundColor: csv ? colors.primary : "transparent",
              borderColor: csv ? colors.primary : colors.outline,
            }}
          >
            {csv && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>✓</Text>}
          </View>
          <Text style={{ color: "#fff", fontSize: 15, fontFamily: "Inter-Medium" }}>CSV (dados tabulares)</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
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