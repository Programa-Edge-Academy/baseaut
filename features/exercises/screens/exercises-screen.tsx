import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DataList } from "@/components/data-list";
import { FilterMenu, FilterOption } from "@/components/filter-menu";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Dumbbell } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NewExercise, NewExerciseData } from "../components/new-exercise";
import { Exercise, useExercises } from "../hooks/use-exercises";
import { SectionField } from "@/components/section-field";

const TAG_FILTER_OPTIONS: FilterOption[] = [
  { id: "all", label: "Todas" },
  { id: "locomotor", label: "Locomotor" },
  { id: "manipulativo", label: "Manipulativo" },
  { id: "estabilizador", label: "Estabilizador" },
];

const AVAILABLE_TAGS = TAG_FILTER_OPTIONS
  .filter((option) => option.id !== "all")
  .map((option) => option.label);

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes && remainder) return `${minutes}min ${remainder}s`;
  if (minutes) return `${minutes}min`;
  return `${remainder}s`;
}

function exerciseToFormData(exercise: Exercise): NewExerciseData {
  return {
    name: exercise.name,
    description: exercise.description,
    durationSeconds: exercise.durationSeconds || 0,
    tag: exercise.tag,
  };
}

export function ExercisesScreen() {
  const {
    exercises,
    isLoading,
    error,
    addExercise,
    updateExercise,
    deleteExercise,
    duplicateExercise,
  } = useExercises();

  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(["all"]);

  const isModalOpen = isCreateModalOpen || exerciseToEdit !== null;

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allSelected = selectedTagIds.includes("all");
    const selectedLabels = TAG_FILTER_OPTIONS
      .filter((option) => option.id !== "all" && selectedTagIds.includes(option.id))
      .map((option) => option.label);

    return exercises.filter((exercise) => {
      const matchesQuery = !normalizedQuery || exercise.name.toLowerCase().includes(normalizedQuery);
      const matchesTags = allSelected || (exercise.tag !== null && selectedLabels.includes(exercise.tag));
      return matchesQuery && matchesTags;
    });
  }, [query, exercises, selectedTagIds]);

  const handleSaveExercise = async (data: NewExerciseData) => {
    try {
      if (exerciseToEdit) {
        await updateExercise(exerciseToEdit.id, data);
        setExerciseToEdit(null);
      } else {
        await addExercise(data);
        setIsCreateModalOpen(false);
      }
    } catch (caught) {
      console.error("Erro ao salvar exercício:", caught);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setExerciseToEdit(null);
  };

  const handleDuplicate = async (exercise: Exercise) => {
    try {
      await duplicateExercise(exercise);
    } catch (caught) {
      console.error("Erro ao duplicar exercício:", caught);
    }
  };

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    try {
      await deleteExercise(exerciseToDelete.id);
    } catch (caught) {
      console.error("Erro ao excluir exercício:", caught);
    } finally {
      setExerciseToDelete(null);
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
        data={filteredExercises}
        emptyMessage="Nenhum exercício encontrado."
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const subtitleParts = [
            item.description,
            formatDuration(item.durationSeconds),
            item.tag
          ].filter(Boolean).join(" · ");

          return (
            <ListCard
              title={item.name}
              subtitle={subtitleParts}
              icon={<Dumbbell size={20} color={colors.secondary} />}
              iconBgColor={withOpacity(colors.secondary, 0.15)}
              showDuplicate
              onEdit={() => setExerciseToEdit(item)}
              onDuplicate={() => handleDuplicate(item)}
              onDelete={() => setExerciseToDelete(item)}
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
          <SectionField mode="exercises"></SectionField>
        </View>

        <View className="mx-8 mt-5">
          <PageHeader
            mode="exercicios"
            title="Exercícios"
            subtitle="Gerencie os exercícios disponíveis"
            onNewPress={() => setIsCreateModalOpen(true)}
          />
        </View>

        <View className="relative z-10 mx-8 mt-5">
          <SearchInput
            placeholder="Buscar por nome..."
            value={query}
            onChangeText={setQuery}
            showTags
            onTagsPress={() => setIsTagFilterOpen((current) => !current)}
          />

          {isTagFilterOpen && (
            <FilterMenu
              mode="multiple-with-all"
              options={TAG_FILTER_OPTIONS}
              selectedIds={selectedTagIds}
              onSelect={setSelectedTagIds}
            />
          )}
        </View>

        {renderListBody()}
      </View>

      <NewExercise
        visible={isModalOpen}
        title={exerciseToEdit ? "Editar exercício" : "Novo exercício"}
        initialData={exerciseToEdit ? exerciseToFormData(exerciseToEdit) : undefined}
        availableTags={AVAILABLE_TAGS}
        onClose={handleCloseModal}
        onSave={handleSaveExercise}
        handlePhotoPress={() => {}}
        handleVideoPress={() => {}}
      />

      <ConfirmationModal
        visible={exerciseToDelete !== null}
        title="Excluir exercício?"
        onClose={() => setExerciseToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <Footer />
    </View>
  );
}