import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { type ToastMode } from "@/components/toast";
import type { Mabc2SectionProps } from "@/features/analysis/components/mabc2-section";
import {
  deleteMabc2Record,
  getMabc2Record,
  saveMabc2Record,
  startMabc2Record,
  useMabc2Records,
  type Mabc2Draft,
} from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordFormScreen } from "@/features/analysis/screens/mabc2-record-form-screen";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

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

  const navigation = useNavigation();

  const currentMode = mode ?? "create";
  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? "Aluno";
  const currentRecordId = recordId ?? "";

  const { records } = useMabc2Records(currentStudentId);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Mabc2Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
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
          setDraft(created);
        } else if (currentRecordId) {
          const existing = await getMabc2Record(currentRecordId);
          setDraft(existing);
        } else {
          throw new Error("Registro não informado.");
        }
      } catch {
        setLoadFailed(true);
        setToastConfig({
          visible: true,
          mode: "error",
          title: "Não foi possível carregar os dados de desenvolvimento motor.",
          description: "Tente novamente",
        });
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [currentMode, currentStudentId, currentRecordId, isAuthorized]);

  const performExit = async (actionToDispatch?: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (currentMode === "create" && draft?.formularioId) {
      try {
        await deleteMabc2Record(draft.formularioId);
      } catch (e) {}
    }
    
    const action = actionToDispatch || pendingAction;
    if (action) {
      navigation.dispatch(action);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (isSubmitting || currentMode === "view") {
        return;
      }

      e.preventDefault();
      setPendingAction(e.data.action);

      if (hasUnsavedChanges) {
        setIsExitModalVisible(true);
      } else {
        performExit(e.data.action);
      }
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, isSubmitting, currentMode, draft?.formularioId]);

  const sections: Mabc2SectionProps[] = useMemo(() => {
    if (!draft) return [];

    return draft.sections.map((section, sectionIndex) => ({
      ...section,
      onChangeCategoryScore: (value) => {
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
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
          setHasUnsavedChanges(true);
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
          setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(false);
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

  async function handleDelete() {
    const targetRecordId = currentRecordId || draft?.formularioId;
    if (!targetRecordId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await deleteMabc2Record(targetRecordId);
      setHasUnsavedChanges(false);
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
          recordCount={records.length}
          totalScore={null}
          totalPercentile={null}
          sections={[]}
          readOnly
          toastConfig={toastConfig}
          onHideToast={() => {
            setToastConfig((prev) => ({ ...prev, visible: false }));
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
        recordCount={records.length}
        totalScore={draft.totalScore}
        totalPercentile={draft.totalPercentile}
        sections={sections}
        readOnly={currentMode === "view"}
        showErrors={showErrors}
        submitLabel={currentMode === "edit" ? "Salvar" : "Registrar"}
        toastConfig={toastConfig}
        onHideToast={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
        onChangeTotalScore={(value) => {
          setHasUnsavedChanges(true);
          setDraft((current) =>
            current ? { ...current, totalScore: parseNumber(value) } : current
          );
        }}
        onChangeTotalPercentile={(value) => {
          setHasUnsavedChanges(true);
          setDraft((current) =>
            current
              ? { ...current, totalPercentile: value.trim() || null }
              : current
          );
        }}
        onPressBack={() => router.back()}
        onRegister={handleSave}
        onEdit={() =>
          router.replace({
            pathname: "/mabc2-record-form",
            params: {
              mode: "edit",
              studentId: currentStudentId,
              studentName: currentStudentName,
              recordId: currentRecordId || draft.formularioId,
            },
          } as any)
        }
        onDelete={handleDelete}
        onViewRecords={() =>
          router.replace({
            pathname: "/mabc2-records",
            params: {
              studentId: currentStudentId,
              studentName: currentStudentName,
            },
          } as any)
        }
      />
      <ConfirmationModal
        visible={isExitModalVisible}
        onClose={() => setIsExitModalVisible(false)}
        onConfirm={() => {
          setIsExitModalVisible(false);
          performExit();
        }}
        title="Você tem certeza que deseja sair?"
        message="Os dados preenchidos serão perdidos."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        iconType="alert"
        mode="delete"
      />
    </>
  );
}