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
import { SwipeNavigator } from "@/components/swipe-navigator";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TranslationKey } from "@/features/settings/constants/translations";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { router } from "expo-router";
import { Dumbbell } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { NewExercise, NewExerciseData } from "../components/new-exercise";
import { Exercise, useExercises } from "../hooks/use-exercises";
import { translateTag } from "../utils/tag-labels";

/** Tag filter definitions: stable id, stored (pt) value, and translation key. */
const TAG_DEFS: { id: string; value: string | null; labelKey: TranslationKey }[] = [
  { id: "all", value: null, labelKey: "tags.all" },
  { id: "coordenacao", value: "Coordenação", labelKey: "tags.coordenacao" },
  { id: "forca", value: "Força", labelKey: "tags.forca" },
  { id: "equilibrio", value: "Equilíbrio", labelKey: "tags.equilibrio" },
];

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

/** Props for {@link ExercisesScreen}. */
export type ExercisesScreenProps = {
  /**
   * When true, the screen is a tutorial practice replica: mocked data, no
   * footer/swipe, and the "Em tutorial" header with its guided spotlight flow.
   */
  tutorial?: boolean;
};

/**
 * Exercises list screen with search, filters, and CRUD modals. Used both as the
 * real screen and, with `tutorial`, as its guided tutorial practice replica.
 */
export function ExercisesScreen({ tutorial = false }: ExercisesScreenProps) {
  const { t } = useI18n();
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
  } = useExercises({ mock: tutorial });

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
  const [noticeOpen, setNoticeOpen] = useState(false);

  const sim = useTutorialSimulation();
  const newButtonRef = useRef<View>(null);

  const isModalOpen = isCreateModalOpen || exerciseToEdit !== null;

  const tagFilterOptions: FilterOption[] = TAG_DEFS.map((d) => ({
    id: d.id,
    label: t(d.labelKey),
  }));
  const availableTags = TAG_DEFS.filter((d) => d.value).map((d) => d.value!);

  /** The exercise created during the guided simulation (spotlight target). */
  const createdExercise = tutorial
    ? exercises.find((e) => e.id.startsWith("mock-new-"))
    : undefined;

  // Register the "+ New" spotlight target.
  useEffect(() => {
    if (!tutorial) return;
    sim.registerTarget("new", newButtonRef, { rounded: true });
    return () => sim.unregisterTarget("new");
  }, [tutorial, sim]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allSelected = selectedTagIds.includes("all");
    const selectedValues = TAG_DEFS.filter(
      (d) => d.id !== "all" && selectedTagIds.includes(d.id),
    ).map((d) => d.value!);

    return exercises.filter((exercise) => {
      const matchesQuery =
        !normalizedQuery ||
        exercise.name.toLowerCase().includes(normalizedQuery);
      const matchesTags =
        allSelected ||
        (exercise.tag !== null && selectedValues.includes(exercise.tag));
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
        sim.complete("save");
      }
    } catch {
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
    } catch {
    }
  };

  /**
   * Confirms and performs deletion of the selected exercise.
   */
  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    try {
      await deleteExercise(exerciseToDelete.id);
      sim.complete("deleteConfirm");
    } catch {
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
        const template =
          count > 1
            ? t("exercises.deleteLinkedPlural")
            : t("exercises.deleteLinkedSingular");
        setDeleteModalMessage(template.replace("{n}", String(count)));
      } else {
        setDeleteModalMessage(undefined);
      }
    } catch {
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
          emptyMessage={t("exercises.empty")}
          onRefresh={refresh}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCreated = tutorial && item.id.startsWith("mock-new-");
            const subtitleParts = [
              item.description,
              formatDuration(item.durationSeconds),
              item.tag ? translateTag(item.tag, t) : "",
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
                moreButtonSpotlightKeys={
                  isCreated ? ["duplicateMenu", "deleteMenu"] : undefined
                }
                duplicateSpotlightKey={isCreated ? "duplicateSelect" : undefined}
                deleteSpotlightKey={isCreated ? "deleteSelect" : undefined}
                onMenuOpen={
                  isCreated
                    ? () => {
                        sim.complete("duplicateMenu");
                        sim.complete("deleteMenu");
                      }
                    : undefined
                }
                onEdit={() => setExerciseToEdit(item)}
                onDuplicate={() => {
                  handleDuplicate(item);
                  sim.complete("duplicateSelect");
                }}
                onDelete={() => {
                  handleDeleteRequest(item);
                  sim.complete("deleteSelect");
                }}
                enableRipple={true}
              />
            );
          }}
        />
      </View>
    );
  };

  const content = (
    <View className="flex-1">
      <View className="mx-8 mt-5">
        <SectionField mode="exercises"></SectionField>
      </View>

      <View className="mx-8 mt-5">
        <PageHeader
          mode="exercicios"
          title={t("exercises.title")}
          subtitle={t("exercises.subtitle")}
          newButtonRef={tutorial ? newButtonRef : undefined}
          onNewPress={() => {
            setIsCreateModalOpen(true);
            sim.complete("new");
          }}
        />
      </View>

      <View className="relative z-10 mx-8 mt-5">
        <SearchInput
          placeholder={t("common.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          showTags
          onTagsPress={() => setIsTagFilterOpen((current) => !current)}
        />

        {isTagFilterOpen && (
          <FilterMenu
            mode="multiple-with-all"
            options={tagFilterOptions}
            selectedIds={selectedTagIds}
            onSelect={setSelectedTagIds}
          />
        )}
      </View>

      {renderListBody()}
    </View>
  );

  return (
    <View className="flex-1 bg-level1">
      {tutorial ? (
        <Header
          variant="tutorial"
          onPressBack={() => router.back()}
          onPressFinish={() => setNoticeOpen(true)}
        />
      ) : (
        <Header />
      )}

      {tutorial ? (
        content
      ) : (
        <SwipeNavigator onSwipeLeft={() => router.replace("/students")}>
          {content}
        </SwipeNavigator>
      )}

      <NewExercise
        visible={isModalOpen}
        title={
          exerciseToEdit
            ? t("exercises.form.editTitle")
            : t("exercises.form.createTitle")
        }
        initialData={
          exerciseToEdit
            ? {
              ...exerciseToFormData(exerciseToEdit),
              iconUrl: exerciseToEdit.iconUrl,
            }
            : undefined
        }
        availableTags={availableTags}
        onClose={handleCloseModal}
        onSave={handleSaveExercise}
      />

      <ConfirmationModal
        visible={exerciseToDelete !== null}
        title={t("exercises.deleteTitle")}
        message={deleteModalMessage ?? t("common.deleteConfirmMessage")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        confirmSpotlightKey={tutorial ? "deleteConfirm" : undefined}
        onClose={() => {
          setExerciseToDelete(null);
          setDeleteModalMessage(undefined);
        }}
        onConfirm={handleConfirmDelete}
      />

      {!tutorial && <Footer />}

      {tutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => {
            setNoticeOpen(false);
            router.back();
          }}
        />
      )}

      {tutorial && <TutorialSpotlight />}
    </View>
  );
}
