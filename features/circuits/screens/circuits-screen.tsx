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
import { SwipeNavigator } from "@/components/swipe-navigator";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { router } from "expo-router";
import { ClipboardList, Share2, Shuffle } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NewCircuit } from "../components/new-circuit";
import { Circuit, CircuitType, ExecutionMode, useCircuits } from "../hooks/use-circuits";
import { Exercise } from "@/features/exercises/hooks/use-exercises";
import { ViewCircuit } from "../components/view-circuit";

/** Payload emitted by the circuit modal when creating or updating a circuit. */
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

/** Props for {@link CircuitsScreen}. */
export type CircuitsScreenProps = {
  /**
   * When true, the screen is a tutorial practice replica: mocked data, no
   * footer/swipe, and the "Em tutorial" header with its guided spotlight flow.
   */
  tutorial?: boolean;
};

/**
 * Main screen for managing Circuits listing. Used both as the real screen and,
 * with `tutorial`, as its guided tutorial practice replica.
 */
export function CircuitsScreen({ tutorial = false }: CircuitsScreenProps) {
  const { t } = useI18n();
  const {
    circuits,
    isLoading,
    error,
    refresh,
    addCircuit,
    updateCircuit,
    duplicateCircuit,
    deleteCircuit,
  } = useCircuits({ mock: tutorial });

  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [circuitToEdit, setCircuitToEdit] = useState<Circuit | null>(null);
  const [circuitToView, setCircuitToView] = useState<Circuit | null>(null);
  const [circuitToDelete, setCircuitToDelete] = useState<Circuit | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const sim = useTutorialSimulation();
  const newButtonRef = useRef<View>(null);

  const isModalOpen = isCreateModalOpen || circuitToEdit !== null;

  /** The circuit created during the guided simulation (spotlight target). */
  const createdCircuit = tutorial
    ? circuits.find((c) => c.id.startsWith("mock-new-"))
    : undefined;

  useEffect(() => {
    if (!tutorial) return;
    sim.registerTarget("new", newButtonRef, { rounded: true });
    return () => sim.unregisterTarget("new");
  }, [tutorial, sim]);

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
      sim.complete("editSave");
    } else {
      await addCircuit(data);
      setIsCreateModalOpen(false);
      sim.complete("save");
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
    } catch {
    }
  };

  const handleConfirmDelete = async () => {
    if (!circuitToDelete) return;
    try {
      await deleteCircuit(circuitToDelete.id);
      sim.complete("deleteConfirm");
    } catch {
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
      <View className="flex-1 mt-5 px-8">
        <DataList
          data={filteredCircuits}
          emptyMessage={t("circuits.empty")}
          onRefresh={refresh}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMabc = item.type === "mabc_1" || item.type === "mabc_2" || item.type === "mabc_3";
            const isStructured = item.executionMode === "estruturado";
            const isCreated = tutorial && item.id.startsWith("mock-new-");

            let iconColor = isStructured ? colors.primary : colors.extra || "#EAB308";
            let iconComponent = !isStructured
              ? <Shuffle size={20} color={iconColor} />
              : <Share2 size={20} color={iconColor} />;

            let badgeLabel = isStructured
              ? t("circuits.badge.structured")
              : t("circuits.badge.semi");

            if (isMabc) {
              if (item.type === "mabc_1") {
                iconColor = colors.mabc1;
              } else if (item.type === "mabc_2") {
                iconColor = colors.mabc2;
              } else {
                iconColor = colors.mabc3;
              }
              iconComponent = <ClipboardList size={20} color={iconColor} />;
              badgeLabel = t("circuits.badge.mabc");
            }

            const subtitleText = `${item.exercisesCount} ${t("circuits.exercisesSuffix")} · ${item.exercisesSummary}`;

            return (
              <ListCard
                title={item.name}
                subtitle={subtitleText}
                icon={iconComponent}
                iconBgColor={withOpacity(iconColor, 0.15)}
                badge={{ label: badgeLabel, color: iconColor }}
                showDuplicate={!isMabc}
                moreButtonSpotlightKeys={
                  isCreated ? ["editMenu", "deleteMenu"] : undefined
                }
                editSpotlightKey={isCreated ? "editSelect" : undefined}
                deleteSpotlightKey={isCreated ? "deleteSelect" : undefined}
                onMenuOpen={
                  isCreated
                    ? () => {
                        sim.complete("editMenu");
                        sim.complete("deleteMenu");
                      }
                    : undefined
                }
                onPress={isMabc ? () => setCircuitToView(item) : () => setCircuitToEdit(item)}
                onEdit={
                  isMabc
                    ? undefined
                    : () => {
                        setCircuitToEdit(item);
                        sim.complete("editSelect");
                      }
                }
                onDuplicate={isMabc ? undefined : () => handleDuplicate(item)}
                onDelete={
                  isMabc
                    ? undefined
                    : () => {
                        setCircuitToDelete(item);
                        sim.complete("deleteSelect");
                      }
                }
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
        <SectionField mode="circuits" />
      </View>

      <View className="mx-8 mt-5">
        <PageHeader
          mode="exercicios"
          title={t("circuits.title")}
          subtitle={t("circuits.subtitle")}
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
          showTags={false}
        />
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

      <NewCircuit
        visible={isModalOpen}
        mock={tutorial}
        title={circuitToEdit ? t("circuits.form.editTitle") : t("circuits.form.createTitle")}
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
        title={t("circuits.deleteTitle")}
        message={t("common.deleteConfirmMessage")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        confirmSpotlightKey={tutorial ? "deleteConfirm" : undefined}
        onClose={() => setCircuitToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {!tutorial && <Footer />}

      {tutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => setNoticeOpen(false)}
        />
      )}

      {tutorial && <TutorialSpotlight />}
    </View>
  );
}
