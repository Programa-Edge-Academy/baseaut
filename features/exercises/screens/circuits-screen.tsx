import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { SectionField } from "@/components/section-field";
import { ClipboardList, Share2, Shuffle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NewCircuit } from "../components/new-circuit"; 
import { Circuit, CircuitType, ExecutionMode, useCircuits } from "../hooks/use-circuits";
import { Exercise } from "../hooks/use-exercises";
import { ViewCircuit } from "../components/view-circuit";

export interface SaveCircuitPayload {
  name: string;
  type: CircuitType;
  executionMode: ExecutionMode;
  form: string | null;
  exercises: Exercise[];
}

/**
 * Maps a circuit domain model into the ui option format expected by the modal.
 * @param circuit - The active circuit object selected for editing.
 */
function circuitToFormData(circuit: Circuit) {
  return {
    name: circuit.name,
    executionMode: circuit.executionMode,
    type: circuit.type,
    form: circuit.formId,
    exercises: circuit.exercises,
  };
}

/**
 * Main screen for managing Circuits listing.
 */
export function CircuitsScreen() {
  const {
    circuits,
    isLoading,
    error,
    addCircuit,
    updateCircuit,
    duplicateCircuit,
    deleteCircuit,
  } = useCircuits();

  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [circuitToEdit, setCircuitToEdit] = useState<Circuit | null>(null);
  const [circuitToView, setCircuitToView] = useState<Circuit | null>(null);
  const [circuitToDuplicate, setCircuitToDuplicate] = useState<Circuit | null>(null);
  const [circuitToDelete, setCircuitToDelete] = useState<Circuit | null>(null);

  const isModalOpen = isCreateModalOpen || circuitToEdit !== null;

  const filteredCircuits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = circuits.filter((circuit) => {
      return !normalizedQuery || circuit.name.toLowerCase().includes(normalizedQuery);
    });

    return [...filtered].sort((a, b) => {
      const typeOrder: Record<string, number> = {
        mabc_1: 1,
        mabc_2: 2,
        mabc_3: 3,
      };
      const orderA = typeOrder[a.type] || 99;
      const orderB = typeOrder[b.type] || 99;
      return orderA - orderB;
    });
  }, [query, circuits]);

  const handleSaveCircuit = async (data: SaveCircuitPayload) => {
    if (circuitToEdit) {
      await updateCircuit(circuitToEdit.id, data);
      setCircuitToEdit(null);
    } else {
      await addCircuit(data);
      setIsCreateModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setCircuitToEdit(null);
  };

  /**
   * Duplicates an circuit entry.
   */
  const handleDuplicate = async (circuit: Circuit) => {
    try {
      await duplicateCircuit(circuit);
    } catch (caught) {
      console.error("Erro ao duplicar circuito:", caught);
    }
  };

  const handleConfirmDelete = async () => {
    if (!circuitToDelete) return;
    try {
      await deleteCircuit(circuitToDelete.id);
    } catch (caught) {
      console.error("Error deleting circuit:", caught);
    } finally {
      setCircuitToDelete(null);
    }
  };

  const renderListBody = () => {
    if (isLoading) {
      return (
        <View className="mt-16 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View className="mt-16 items-center justify-center px-8">
          <Text className="text-center text-default-1 text-error">
            {error.message}
          </Text>
        </View>
      );
    }

    return (
      <DataList
        className="mt-5 px-8"
        data={filteredCircuits}
        emptyMessage="Nenhum circuito encontrado."
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMabc = item.type === "mabc_1" || item.type === "mabc_2" || item.type === "mabc_3";
          const isStructured = item.executionMode === "estruturado";

          let iconColor = isStructured ? colors.primary : colors.extra || "#EAB308";
          let iconComponent = !isStructured
            ? <Shuffle size={20} color={iconColor} /> 
            : <Share2 size={20} color={iconColor} />;
            
          let badgeLabel = isStructured ? "Estruturado" : "Livre";

          if (isMabc) {
            if (item.type === "mabc_1") {
              iconColor = colors.mabc1;
            } else if (item.type === "mabc_2") {
              iconColor = colors.mabc2;
            } else {
              iconColor = colors.mabc3;
            }
            iconComponent = <ClipboardList size={20} color={iconColor} />;
            badgeLabel = "MABC-2";
          }

          const subtitleText = `${item.exercisesCount} exercícios · ${item.exercisesSummary}`;

          return (
            <ListCard
              title={item.name}
              subtitle={subtitleText}
              icon={iconComponent}
              iconBgColor={withOpacity(iconColor, 0.15)}
              badge={{ label: badgeLabel, color: iconColor }}
              showDuplicate={!isMabc}
              onPress={!isMabc ? () => setCircuitToEdit(item) : undefined}
              onEdit={isMabc ? undefined : () => setCircuitToEdit(item)}
              onDuplicate={isMabc ? undefined : () => handleDuplicate(item)}
              onDelete={isMabc ? undefined : () => setCircuitToDelete(item)}
              enableRipple={!isMabc}
            />
          );
        }}
      />
    );
  };

  return (
    <View className="flex-1 bg-level1">
      <Header />

      <View className="flex-1">
        <View className="mx-8 mt-5">
          <SectionField mode="circuits" />
        </View>

        <View className="mx-8 mt-5">
          <PageHeader
            mode="exercicios" 
            title="Circuitos"
            subtitle="Monte circuitos com exercícios"
            onNewPress={() => setIsCreateModalOpen(true)}
          />
        </View>

        <View className="relative z-10 mx-8 mt-5">
          <SearchInput
            placeholder="Buscar circuito por nome..."
            value={query}
            onChangeText={setQuery}
            showTags={false} 
          />
        </View>

        {renderListBody()}
      </View>

      <NewCircuit
        visible={isModalOpen}
        title={circuitToEdit ? "Editar circuito" : "Novo circuito"}
        initialData={circuitToEdit ? circuitToFormData(circuitToEdit) : undefined}
        onClose={handleCloseModal}
        onSave={handleSaveCircuit}
      />

      <ViewCircuit
        visible={circuitToView !== null}
        circuitData={circuitToView ? {
          name: circuitToView.name,
          executionMode: circuitToView.executionMode,
          exercises: circuitToView.exercises,
        } : null}
        onClose={() => setCircuitToView(null)}
      />

      <ConfirmationModal
        visible={circuitToDelete !== null}
        title="Excluir circuito?"
        onClose={() => setCircuitToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <Footer />
    </View>
  );
}