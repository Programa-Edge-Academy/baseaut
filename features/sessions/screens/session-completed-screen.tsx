import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SelectableChip } from "@/components/selectable-chip";
import { SessionCompletion } from "@/features/exercises/components/session-completion";
import { useExercises } from "@/features/exercises/hooks/use-exercises";
import { useRouter } from "expo-router";
import { ClipboardList, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

/** Props for {@link SessionCompletedScreen}. */
interface SessionCompletedScreenProps {
  type: string;
  studentName: string;
  /** JSON-encoded list of exercises still pending in the circuit. */
  queue?: string;
  /** JSON-encoded list of all circuit exercises. */
  fullCircuit?: string;
  studentId?: string;
  sessionId?: string;
  /**
   * Number of exercises attempted during the session (the `x/y` denominator).
   * Passed by semi-structured sessions, where never-attempted exercises must
   * not count; falls back to the full circuit length when absent.
   */
  attempted?: string;
  /** Number of attempted exercises marked as realized (the `x/y` numerator). */
  realized?: string;
}

/**
 * Post-session screen showing completion progress and continuation options:
 * retry unrealized exercises, repeat selected ones, or run another team
 * exercise — all within the same session.
 */
export function SessionCompletedScreen({
  type,
  studentName,
  queue,
  fullCircuit,
  studentId,
  sessionId,
  attempted,
  realized,
}: SessionCompletedScreenProps) {
  const router = useRouter();

  const filaDePendentes = queue ? JSON.parse(queue) : [];
  const circuitoCompleto = fullCircuit ? JSON.parse(fullCircuit) : [];

  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [selectedRepeatIds, setSelectedRepeatIds] = useState<string[]>([]);

  const { exercises: teamExercises, isLoading: isExercisesLoading } =
    useExercises();
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [selectedOtherIds, setSelectedOtherIds] = useState<string[]>([]);

  const handleToggleOther = (id: string) => {
    setSelectedOtherIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const handleConfirmOther = () => {
    const chosen = teamExercises
      .filter((ex) => selectedOtherIds.includes(ex.id))
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        description: ex.description ?? "",
      }));

    if (chosen.length === 0) return;

    setIsOtherModalOpen(false);
    router.push({
      pathname: "/session/semi-structured",
      params: {
        studentName,
        studentId: studentId ?? "",
        sessionId: sessionId ?? "",
        circuitName: "Outro exercício",
        queue: JSON.stringify(chosen),
      },
    });
  };

  const isSemiStructured = type === "semi-structured" || type === "free";
  const temWarnings = filaDePendentes.length > 0;

  const subtitleLabel = isSemiStructured
    ? "Circuito Semi-estruturado"
    : "Circuito Estruturado";
  const detailsLabel = `${studentName} · ${subtitleLabel}`;

  const hasAttemptCounts = attempted !== undefined && attempted !== "";
  const totalExercicios = hasAttemptCounts
    ? Number(attempted)
    : circuitoCompleto.length;
  const concluidosCount = hasAttemptCounts
    ? Number(realized ?? 0)
    : circuitoCompleto.filter(
        (ex: any) => !filaDePendentes.some((p: any) => p.id === ex.id),
      ).length;
  const progressLabel = `${concluidosCount}/${totalExercicios}`;

  const handleToggleRepeat = (id: string) => {
    setSelectedRepeatIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleConfirmRepeat = () => {
    const exercisesToRepeat = circuitoCompleto.filter((ex: any) =>
      selectedRepeatIds.includes(ex.id),
    );

    if (exercisesToRepeat.length > 0) {
      setIsRepeatModalOpen(false);
      router.push({
        pathname: "/session/semi-structured",
        params: {
          queue: JSON.stringify(exercisesToRepeat),
          studentName,
          studentId: studentId ?? "",
          sessionId: sessionId ?? "",
        },
      });
    }
  };

  return (
    <>
      <View className="flex-1 bg-level1">
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View>
            <Header
              variant="back"
              onPressBack={() => router.replace("/students")}
            />

            <View className="mx-8 mt-5">
              <PageHeader
                title={`Sessão de ${studentName}`}
                subtitle={subtitleLabel}
              />
            </View>

            <View className="top-[5%] mx-5 rounded-2xl bg-level1 p-5 justify-center items-center">
              <SessionCompletion
                details={detailsLabel}
                className=""
                statusLabel={isSemiStructured ? "" : "Realizadas"}
                hasWarnings={temWarnings}
                unrealizedCount={filaDePendentes.length}
                progress={progressLabel}
                onBackToStart={() => {
                  router.replace("/students");
                }}
                onSelectContinuation={(id) => {
                  if (id === "try_unrealized") {
                    router.push({
                      pathname: "/session/semi-structured",
                      params: {
                        queue: JSON.stringify(filaDePendentes),
                        studentName,
                        studentId: studentId ?? "",
                        sessionId: sessionId ?? "",
                      },
                    });
                  } else if (id === "repeat_exercise") {
                    setSelectedRepeatIds([]);
                    setIsRepeatModalOpen(true);
                  } else if (id === "do_other") {
                    setSelectedOtherIds([]);
                    setIsOtherModalOpen(true);
                  }
                }}
              />
            </View>
          </View>
        </ScrollView>

        <AppModal visible={isRepeatModalOpen} transparent animationType="fade">
          <View className="flex-1 bg-black/60 justify-center items-center px-4">
            <View className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[600px] overflow-hidden">
              <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
                <Text className="text-white text-header-2">
                  Repetir exercícios
                </Text>
                <Pressable
                  onPress={() => setIsRepeatModalOpen(false)}
                  className="p-1 active:opacity-70"
                >
                  <X size={24} color={colors.muted} />
                </Pressable>
              </View>

              <ScrollView className="max-h-[400px] px-5 py-4">
                <Text className="text-muted text-default-2 mb-4">
                  Selecione quais exercícios deste circuito você deseja repetir:
                </Text>
                <View className="gap-2.5">
                  {circuitoCompleto.map((ex: any) => (
                    <SelectableChip
                      key={ex.id}
                      label={ex.name || ex.title}
                      isSelected={selectedRepeatIds.includes(ex.id)}
                      onToggle={() => handleToggleRepeat(ex.id)}
                    />
                  ))}
                </View>
              </ScrollView>

              <View className="p-5 border-t border-t-outline/30">
                <ActionButtons
                  onCancel={() => setIsRepeatModalOpen(false)}
                  onSave={handleConfirmRepeat}
                  cancelLabel="Cancelar"
                  saveLabel="Iniciar"
                  disabled={selectedRepeatIds.length === 0}
                />
              </View>
            </View>
          </View>
        </AppModal>

        <AppModal visible={isOtherModalOpen} transparent animationType="fade">
          <View className="flex-1 bg-black/60 justify-center items-center px-4">
            <View className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[600px] overflow-hidden">
              <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
                <Text className="text-white text-header-2">
                  Realizar outro exercício
                </Text>
                <Pressable
                  onPress={() => setIsOtherModalOpen(false)}
                  className="p-1 active:opacity-70"
                >
                  <X size={24} color={colors.muted} />
                </Pressable>
              </View>

              <ScrollView className="max-h-[400px] px-5 py-4">
                <Text className="text-muted text-default-2 mb-4">
                  Selecione qualquer exercício da equipe para realizar nesta
                  sessão:
                </Text>

                {isExercisesLoading ? (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : teamExercises.length === 0 ? (
                  <Text className="text-muted text-default-2 py-6 text-center">
                    Nenhum exercício cadastrado na equipe.
                  </Text>
                ) : (
                  <View className="gap-2.5">
                    {teamExercises.map((ex) => (
                      <SelectableChip
                        key={ex.id}
                        label={ex.name}
                        isSelected={selectedOtherIds.includes(ex.id)}
                        onToggle={() => handleToggleOther(ex.id)}
                      />
                    ))}
                  </View>
                )}
              </ScrollView>

              <View className="p-5 border-t border-t-outline/30">
                <ActionButtons
                  onCancel={() => setIsOtherModalOpen(false)}
                  onSave={handleConfirmOther}
                  cancelLabel="Cancelar"
                  saveLabel="Iniciar"
                  disabled={selectedOtherIds.length === 0}
                />
              </View>
            </View>
          </View>
        </AppModal>
      </View>
    </>
  );
}
