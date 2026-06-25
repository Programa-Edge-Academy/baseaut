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
import { SectionField } from "@/components/section-field";
import { Dumbbell } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { NewExercise, NewExerciseData } from "../components/new-exercise";
import { Exercise, useExercises } from "../hooks/use-exercises";

const TAG_FILTER_OPTIONS: FilterOption[] = [
  { id: "all", label: "Todas" },
  { id: "coordenacao", label: "Coordenação" },
  { id: "forca", label: "Força" },
  { id: "equilibrio", label: "Equilíbrio" },
];

const AVAILABLE_TAGS = TAG_FILTER_OPTIONS.filter(
  (option) => option.id !== "all",
).map((option) => option.label);

/**
 * Formats a duration in seconds into a human-readable label.
 */
function formatDuration(seconds?: number | null): string {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes && remainder) return `${minutes}min ${remainder}s`;
  if (minutes) return `${minutes}min`;
  return `${remainder}s`;
}

/**
 * Maps an exercise model into the form payload shape.
 */
function exerciseToFormData(exercise: Exercise): NewExerciseData {
  return {
    name: exercise.name,
    description: exercise.description,
    durationSeconds: exercise.durationSeconds || 0,
    tag: exercise.tag,
    subtags: exercise.subtags || [],
  };
}

/**
 * Exercises list screen with search, filters, and CRUD modals.
 */
export function ExercisesScreen() {
  const {
    exercises,
    isLoading,
    error,
    refresh,
    addExercise,
    updateExercise,
    deleteExercise,
    getExerciseCircuitCount,
    duplicateExercise,
  } = useExercises();

  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(
    null,
  );
  const [deleteModalMessage, setDeleteModalMessage] = useState<
    string | undefined
  >(undefined);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(["all"]);

  const isModalOpen = isCreateModalOpen || exerciseToEdit !== null;

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allSelected = selectedTagIds.includes("all");
    const selectedLabels = TAG_FILTER_OPTIONS.filter(
      (option) => option.id !== "all" && selectedTagIds.includes(option.id),
    ).map((option) => option.label);

    return exercises.filter((exercise) => {
      const matchesQuery =
        !normalizedQuery ||
        exercise.name.toLowerCase().includes(normalizedQuery);
      const matchesTags =
        allSelected ||
        (exercise.tag !== null && selectedLabels.includes(exercise.tag));
      return matchesQuery && matchesTags;
    });
  }, [query, exercises, selectedTagIds]);

  /**
   * Handles create or update of an exercise from the modal.
   */
  const handleSaveExercise = async (
    data: NewExerciseData,
    photoUri: string | null,
  ) => {
    try {
      if (exerciseToEdit) {
        await updateExercise(exerciseToEdit.id, data, photoUri);
        setExerciseToEdit(null);
      } else {
        await addExercise(data, photoUri);
        setIsCreateModalOpen(false);
      }
    } catch (caught) {
      console.error("Erro ao salvar exercício:", caught);
    }
  };

  /**
   * Closes the create/edit modal and clears selection.
   */
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setExerciseToEdit(null);
  };

  /**
   * Duplicates an exercise entry.
   */
  const handleDuplicate = async (exercise: Exercise) => {
    try {
      await duplicateExercise(exercise);
    } catch (caught) {
      console.error("Erro ao duplicar exercício:", caught);
    }
  };

  /**
   * Confirms and performs deletion of the selected exercise.
   */
  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    try {
      await deleteExercise(exerciseToDelete.id);
    } catch (caught) {
      console.error("Erro ao excluir exercício:", caught);
    } finally {
      setExerciseToDelete(null);
      setDeleteModalMessage(undefined);
    }
  };

  const handleDeleteRequest = async (exercise: Exercise) => {
    try {
      const count = await getExerciseCircuitCount(exercise.id);
      setExerciseToDelete(exercise);
      if (count > 0) {
        setDeleteModalMessage(
          `Este exercício está vinculado a ${count} circuito${count > 1 ? "s" : ""}. A exclusão pode impactar esses circuitos e não pode ser desfeita.`,
        );
      } else {
        setDeleteModalMessage(undefined);
      }
    } catch (err) {
      console.error("Erro ao verificar vínculos de circuitos:", err);
      setExerciseToDelete(exercise);
      setDeleteModalMessage(undefined);
    }
  };

  /**
   * Renders the list content depending on loading or error state.
   */
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
      <View className="flex-1 mt-5 px-8">
        <DataList
          data={filteredExercises}
          emptyMessage="Nenhum exercício encontrado."
          onRefresh={refresh}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const subtitleParts = [
              item.description,
              formatDuration(item.durationSeconds),
              item.tag,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <ListCard
                title={item.name}
                subtitle={subtitleParts}
                onPress={() => setExerciseToEdit(item)}
                icon={
                  item.iconUrl ? (
                    <Image
                      source={{ uri: item.iconUrl }}
                      style={{ width: "100%", height: "100%", borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Dumbbell size={20} color={colors.secondary} />
                  )
                }
                iconBgColor={
                  item.iconUrl
                    ? "transparent"
                    : withOpacity(colors.secondary, 0.15)
                }
                showDuplicate
                onEdit={() => setExerciseToEdit(item)}
                onDuplicate={() => handleDuplicate(item)}
                onDelete={() => handleDeleteRequest(item)}
                enableRipple={true}
              />
            );
          }}
        />
      </View>
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
        initialData={
          exerciseToEdit
            ? {
              ...exerciseToFormData(exerciseToEdit),
              iconUrl: exerciseToEdit.iconUrl,
            }
            : undefined
        }
        availableTags={AVAILABLE_TAGS}
        onClose={handleCloseModal}
        onSave={handleSaveExercise}
      />

      <ConfirmationModal
        visible={exerciseToDelete !== null}
        title="Excluir exercício?"
        message={deleteModalMessage}
        onClose={() => {
          setExerciseToDelete(null);
          setDeleteModalMessage(undefined);
        }}
        onConfirm={handleConfirmDelete}
      />

      <Footer />
    </View>
  );
}
