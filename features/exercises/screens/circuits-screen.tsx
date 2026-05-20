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
import { Share2, Shuffle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NewCircuit } from "../components/new-circuit"; 
import { Circuit, CircuitType, ExecutionMode, useCircuits } from "../hooks/use-circuits";
import { Exercise } from "../hooks/use-exercises";

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
    deleteCircuit,
  } = useCircuits();

  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [circuitToEdit, setCircuitToEdit] = useState<Circuit | null>(null);
  const [circuitToDelete, setCircuitToDelete] = useState<Circuit | null>(null);

  const isModalOpen = isCreateModalOpen || circuitToEdit !== null;

  const filteredCircuits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return circuits.filter((circuit) => {
      return !normalizedQuery || circuit.name.toLowerCase().includes(normalizedQuery);
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
          const isStructured = item.executionMode === "estruturado";

          const iconColor = isStructured ? colors.primary : colors.extra || "#EAB308";
          const iconComponent = !isStructured
            ? <Shuffle size={20} color={iconColor} /> 
            : <Share2 size={20} color={iconColor} />;
            
          const badgeLabel = isStructured ? "Estruturado" : "Livre";
          const subtitleText = `${item.exercisesCount} exercícios · ${item.exercisesSummary}`;

          return (
            <ListCard
              title={item.name}
              subtitle={subtitleText}
              icon={iconComponent}
              iconBgColor={withOpacity(iconColor, 0.15)}
              badge={{ label: badgeLabel, color: iconColor }}
              showDuplicate={false}
              onEdit={() => setCircuitToEdit(item)}
              onDelete={() => setCircuitToDelete(item)}
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