import { colors } from "@/assets/colors";
import type { Mabc2SectionProps } from "@/features/analysis/components/mabc2-section";
import {
  deleteMabc2Record,
  getMabc2Record,
  saveMabc2Record,
  startMabc2Record,
  type Mabc2Draft,
} from "@/features/analysis/hooks/use-mabc2-records";
import { Mabc2RecordFormScreen } from "@/features/analysis/screens/mabc2-record-form-screen";
import { router, useLocalSearchParams } from "expo-router";
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

  const currentMode = mode ?? "create";
  const currentStudentId = studentId ?? "";
  const currentStudentName = studentName ?? "Aluno";

  const [draft, setDraft] = useState<Mabc2Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    async function load() {
      setIsLoading(true);

      try {
        if (currentMode === "create") {
          const created = await startMabc2Record(currentStudentId);
          setDraft(created);
        } else if (recordId) {
          const existing = await getMabc2Record(recordId);
          setDraft(existing);
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [currentMode, currentStudentId, recordId]);

  const sections: Mabc2SectionProps[] = useMemo(() => {
    if (!draft) return [];

    return draft.sections.map((section, sectionIndex) => ({
      ...section,
      onChangeCategoryScore: (value) => {
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
        onChangeScore: (value) => {
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

  async function handleSave() {
    if (!draft) return;

    await saveMabc2Record(draft);

    router.replace({
      pathname: "/mabc2-records",
      params: {
        studentId: currentStudentId,
        studentName: currentStudentName,
      },
    } as any);
  }

  async function handleDelete() {
    if (!recordId) return;

    await deleteMabc2Record(recordId);

    router.replace({
      pathname: "/mabc2-records",
      params: {
        studentId: currentStudentId,
        studentName: currentStudentName,
      },
    } as any);
  }

  if (isLoading || !draft) {
    return (
      <View className="flex-1 items-center justify-center bg-level1">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Mabc2RecordFormScreen
      studentName={currentStudentName}
      recordCount={0}
      totalScore={draft.totalScore}
      totalPercentile={draft.totalPercentile}
      sections={sections}
      readOnly={currentMode === "view"}
      submitLabel={currentMode === "edit" ? "Salvar" : "Registrar"}
      onChangeTotalScore={(value) =>
        setDraft((current) =>
          current ? { ...current, totalScore: parseNumber(value) } : current
        )
      }
      onChangeTotalPercentile={(value) =>
        setDraft((current) =>
          current
            ? { ...current, totalPercentile: value.trim() || null }
            : current
        )
      }
      onPressBack={() => router.back()}
      onRegister={handleSave}
      onEdit={() =>
        router.replace({
          pathname: "/mabc2-record-form",
          params: {
            mode: "edit",
            studentId: currentStudentId,
            studentName: currentStudentName,
            recordId: recordId ?? draft.formularioId,
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
  );
}
