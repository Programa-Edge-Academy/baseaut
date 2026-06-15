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
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

interface SessionCompletedScreenProps {
  type: string;
  studentName: string;
  queue?: string;
  fullCircuit?: string;
  studentId?: string;
  sessionId?: string;
}

export function SessionCompletedScreen({
  type,
  studentName,
  queue,
  fullCircuit,
  studentId,
  sessionId,
}: SessionCompletedScreenProps) {
  const router = useRouter();

  // Abre o Registro de Controle da sessão, reaproveitando a rota de formulário.
  const handleOpenRegistroControle = () => {
    router.push({
      pathname: "/form",
      params: {
        circuitType: "registro_controle",
        circuitName: "Registro de Controle",
        studentName,
        studentId: studentId ?? "",
        sessionId: sessionId ?? "",
      },
    });
  };

  const filaDePendentes = queue ? JSON.parse(queue) : [];
  const circuitoCompleto = fullCircuit ? JSON.parse(fullCircuit) : [];

  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [selectedRepeatIds, setSelectedRepeatIds] = useState<string[]>([]);

  // "Realizar outro exercício": escolher qualquer exercício da equipe (US08.9).
  const { exercises: teamExercises, isLoading: isExercisesLoading } =
    useExercises();
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [selectedOtherIds, setSelectedOtherIds] = useState<string[]>([]);

  const handleToggleOther = (id: string) => {
    setSelectedOtherIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  // Roda os exercícios escolhidos na MESMA sessão (mesmo sessionId).
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
      pathname: "/session/structured",
      params: {
        studentName,
        studentId: studentId ?? "",
        sessionId: sessionId ?? "",
        circuitName: "Outro exercício",
        exercises: JSON.stringify(chosen),
      },
    });
  };

  const isSemiStructured = type === "semi-structured" || type === "free";
  const temWarnings = filaDePendentes.length > 0;

  const subtitleLabel = isSemiStructured
    ? "Circuito Semi-estruturado"
    : "Circuito Estruturado";
  const detailsLabel = `${studentName} · ${subtitleLabel}`;

  const totalExercicios = circuitoCompleto.length;
  const concluidosCount = circuitoCompleto.filter(
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
    const exercisesToRepeat = circuitoCompleto
      .filter((ex: any) => selectedRepeatIds.includes(ex.id))
      .map((ex: any) => ({
        ...ex,
        id: `repeated-${ex.id}-${Date.now()}`,
      }));

    if (exercisesToRepeat.length > 0) {
      setIsRepeatModalOpen(false);
      router.push({
        pathname: "/session/semi-structured",
        params: {
          queue: JSON.stringify(exercisesToRepeat),
          studentName,
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

            {/* Registro de Controle da sessão */}
            <View className="mx-5 mt-2">
              <Pressable
                onPress={handleOpenRegistroControle}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-outline bg-level2 py-4 active:opacity-70"
              >
                <ClipboardList size={20} color={colors.primary} />
                <Text className="text-default-2 font-semibold text-white">
                  Registro de Controle
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal visible={isRepeatModalOpen} transparent animationType="fade">
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
        </Modal>

        {/* Realizar outro exercício: qualquer exercício da equipe (US08.9) */}
        <Modal visible={isOtherModalOpen} transparent animationType="fade">
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
        </Modal>
      </View>
    </>
  );
}
