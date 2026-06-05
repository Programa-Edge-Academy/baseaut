import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SelectableChip } from "@/components/selectable-chip";
import { SessionCompletion } from "@/features/exercises/components/session-completion";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

export function SessionCompletedStructuredScreen() {
  const router = useRouter();
  const { queue, fullCircuit } = useLocalSearchParams<{ queue: string; fullCircuit: string }>();
  
  const filaDePendentes = queue ? JSON.parse(queue) : [];
  const circuitoCompleto = fullCircuit ? JSON.parse(fullCircuit) : [];

  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [selectedRepeatIds, setSelectedRepeatIds] = useState<string[]>([]);

  const handleToggleRepeat = (id: string) => {
    setSelectedRepeatIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleConfirmRepeat = () => {
    const exercisesToRepeat = circuitoCompleto.filter((ex: any) =>
      selectedRepeatIds.includes(ex.id)
    );

    if (exercisesToRepeat.length > 0) {
      setIsRepeatModalOpen(false);
      router.push({
        pathname: "/session/free",
        params: {
          queue: JSON.stringify(exercisesToRepeat),
        },
      });
    }
  };

  return (
    <View className="flex-1 bg-level1">
      <ScrollView>
        <View>
          <Header variant="back" />

          <View className="left-6 top-[2%] w-[264px]">
            <PageHeader title="Sessão de Lucas" subtitle="Circuito 2 · Livre" />
          </View>
          <View className="top-[5%] mx-5 rounded-2xl bg-level1 p-5 justify-center items-center">
            <SessionCompletion
              details={"Lucas · Circuito 1 · Estruturado"}
              className=""
              statusLabel="Realizadas"
              hasWarnings={false}
              unrealizedCount={filaDePendentes.length}
              onBackToStart={function (): void {
                router.replace("/students");
              }}
              progress={"3/3"}
              onSelectContinuation={(id) => {
                if (id === "try_unrealized") {
                  router.push({
                    pathname: "/session/free",
                    params: {
                      queue: JSON.stringify(filaDePendentes),
                    },
                  });
                } else if (id === "repeat_exercise") {
                  setSelectedRepeatIds([]);
                  setIsRepeatModalOpen(true);
                }
              }}
            />
          </View>
        </View>
      </ScrollView>

      <Modal visible={isRepeatModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[600px] overflow-hidden">
            <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
              <Text className="text-white text-header-2">Repetir exercícios</Text>
              <Pressable onPress={() => setIsRepeatModalOpen(false)} className="p-1 active:opacity-70">
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
                    label={ex.name}
                    isSelected={selectedRepeatIds.includes(ex.id)}
                    onToggle={() => handleToggleRepeat(ex.id)}
                  />
                ))}
              </View>
            </ScrollView>

            <View className="p-5 border-t border-outline/30">
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
    </View>
  );
}