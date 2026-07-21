import { AppModal } from "@/components/app-modal";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Text, View, Pressable, useWindowDimensions, ScrollView } from "react-native";
import { X, CheckCircle2, Tags } from "lucide-react-native";
import { ActionButtons } from "@/components/action-buttons";
import { colors } from "@/assets/colors";
import { DefaultTextInput } from "@/components/default-text-input";
import { DraggableList } from "@/components/draggable-list";
import { SelectableChip } from "@/components/selectable-chip";
import { useExercises, Exercise } from "@/features/exercises/hooks/use-exercises";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { SpotlightBinding } from "@/features/tutorial/components/spotlight-binding";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { CircuitType } from "../hooks/use-circuits";
import { TagGroup } from "@/features/exercises/components/tag-group";

type ExecutionMode = "estruturado" | "semi-estruturado";

/** Props for {@link NewCircuit}. */
interface NewCircuitProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** When true, lists mock exercises instead of Supabase (tutorial only). */
  mock?: boolean;
  /** When provided, the modal opens in edit mode pre-filled with this circuit. */
  initialData?: {
    name: string;
    executionMode: ExecutionMode;
    type?: CircuitType;
    form?: string | null;
    exercises: Exercise[];
  };
  onSave: (data: {
    name: string;
    type: CircuitType;
    executionMode: ExecutionMode;
    form: string | null;
    exercises: Exercise[]
  }) => Promise<void>;
}

/**
 * Modal for creating or editing a circuit: sets its name and execution mode,
 * selects exercises (optionally filtered by tag), and reorders them via a
 * draggable list for structured circuits. The exercise picker is capped to a
 * fixed height and scrolls on its own so the modal always fits the screen.
 */
export function NewCircuit({
  visible,
  onClose,
  onSave,
  title,
  mock = false,
  initialData
}: NewCircuitProps) {
  const { exercises } = useExercises({ mock });
  const { height: screenHeight } = useWindowDimensions();
  const { t } = useI18n();
  const sim = useTutorialSimulation();
  const nameFieldRef = useRef<View>(null);
  const modeFieldRef = useRef<View>(null);
  const exercisesFieldRef = useRef<View>(null);
  const reorderFieldRef = useRef<View>(null);
  const saveFieldRef = useRef<View>(null);

  const [name, setName] = useState("");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("estruturado");
  const [orderedExercises, setOrderedExercises] = useState<Exercise[]>([]);
  const [type, setType] = useState<CircuitType>("padrao");
  const [form, setForm] = useState<string | null>(null);

  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubtags, setSelectedSubtags] = useState<Record<string, string[]>>({});

  const [errors, setErrors] = useState({
    name: "",
    exercises: ""
  });

  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const frozenTitle = useRef(title ?? t("circuits.form.createTitle"));

  const isEditing = !!initialData;
  const successMessage = isEditing
    ? t("circuits.form.editedSuccess")
    : t("circuits.form.createdSuccess");

  useEffect(() => {
    if (visible) {
      frozenTitle.current = title ?? t("circuits.form.createTitle");
      if (initialData) {
        setName(initialData.name);
        setExecutionMode(initialData.executionMode);
        setOrderedExercises(initialData.exercises || []);
        setType(initialData.type ?? "padrao");
        setForm(initialData.form ?? null);
      } else {
        setName("");
        setExecutionMode("estruturado");
        setOrderedExercises([]);
        setType("padrao");
        setForm(null);
      }
      setErrors({ name: "", exercises: "" });
      setShowToast(false);
      setIsSaving(false);
      setIsTagFilterOpen(false);
      setSelectedTags([]);
      setSelectedSubtags({});
    }
    // Sync only when the modal opens. `initialData` is rebuilt on every parent
    // render, so depending on it would re-seed the form mid-edit whenever the
    // parent re-renders — which happens each time the guided simulation
    // advances, silently reverting the user's own edits (e.g. the execution
    // mode back to the saved one).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Advance the guided simulation as each field is filled in.
  useEffect(() => {
    if (sim.currentKey === "name" && name.trim().length > 0) {
      sim.complete("name");
    }
  }, [sim, name]);

  useEffect(() => {
    if (sim.currentKey === "mode" && executionMode === "semi-estruturado") {
      sim.complete("mode");
    }
    if (sim.currentKey === "changeStructured" && executionMode === "estruturado") {
      sim.complete("changeStructured");
    }
  }, [sim, executionMode]);

  useEffect(() => {
    // Require two exercises so the later reorder step is actually possible.
    if (sim.currentKey === "selectExercises" && orderedExercises.length >= 2) {
      sim.complete("selectExercises");
    }
  }, [sim, orderedExercises]);

  const handleToggleExercise = (exercise: Exercise) => {
    if (errors.exercises) setErrors(prev => ({ ...prev, exercises: "" }));
    setOrderedExercises((prev) => {
      const isAlreadySelected = prev.some((e) => e.id === exercise.id);
      if (isAlreadySelected) {
        return prev.filter((e) => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const availableTags = ["Coordenação", "Força", "Equilíbrio"];
  const availableSubtags = ["locomotor", "manipulativo", "estabilizador"];

  const filteredExercises = exercises.filter((ex) => {
    if (selectedTags.length === 0) return true;

    if (!ex.tag || !selectedTags.includes(ex.tag)) return false;

    const subsForTag = selectedSubtags[ex.tag] || [];
    if (subsForTag.length === 0) return true;

    if (!ex.subtags || ex.subtags.length === 0) return false;
    return ex.subtags.some((sub) => subsForTag.includes(sub));
  });


  const handleValidationAndSave = async () => {
    let isValid = true;
    const newErrors = { name: "", exercises: "" };

    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = t("circuits.form.err.nameRequired");
      isValid = false;
    }

    if (orderedExercises.length === 0) {
      newErrors.exercises = t("circuits.form.err.exercisesRequired");
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSave({
        name: trimmedName,
        type,
        executionMode,
        form,
        exercises: orderedExercises,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Bound from inside the modal so the tap guard treats these as its own. */}
      <SpotlightBinding targetKey="name" viewRef={nameFieldRef} />
      <SpotlightBinding
        targetKey={["mode", "changeStructured"]}
        viewRef={modeFieldRef}
      />
      <SpotlightBinding targetKey="selectExercises" viewRef={exercisesFieldRef} />
      <SpotlightBinding targetKey="reorder" viewRef={reorderFieldRef} />
      {/* The save button serves both the creation save and the edit save. */}
      <SpotlightBinding targetKey={["save", "editSave"]} viewRef={saveFieldRef} />

      <View className="flex-1 justify-center items-center">
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={Keyboard.dismiss}
        />
        <View
          className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[900px] overflow-hidden relative"
          style={{ maxHeight: screenHeight * 0.85 }}
        >
          {showToast && (
            <View className="absolute top-5 left-5 right-5 z-50 bg-level1 border border-primary rounded-xl p-4 shadow-panelShadow flex-row items-center">
              <CheckCircle2 color={colors.primary} size={24} />
              <Text className="text-content text-default-1 ml-3 flex-1">
                {successMessage}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
            <Text className="text-content text-header-2">{frozenTitle.current}</Text>
            <Pressable onPress={onClose} disabled={isSaving} className="p-1 active:opacity-70">
              <X size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-shrink"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isDragging}
            contentContainerStyle={{ padding: 20 }}
          >
            <View className="gap-5 mb-5">
              <View ref={nameFieldRef} collapsable={false} className="gap-2">
                  <Text className="text-muted text-default-1">{t("circuits.form.name")}*</Text>
                  <DefaultTextInput
                    value={name}
                    maxLength={20}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    placeholder={t("circuits.form.namePlaceholder")}
                    className="h-[44px]"
                    outLineBorderClass={errors.name ? "border-error" : "border-outline"}
                  />
                  {errors.name ? (
                    <Text className="text-error text-default-3 mt-1 ml-1">{errors.name}</Text>
                  ) : null}
                </View>

              <View>
                <View ref={modeFieldRef} collapsable={false} className="gap-2">
                  <Text className="text-muted text-default-1">{t("circuits.form.type")}*</Text>
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setExecutionMode("estruturado")}
                      className={`flex-1 p-3.5 rounded-xl border ${executionMode === "estruturado" ? "border-primary bg-primary/10" : "border-outline bg-level1"
                        }`}
                    >
                      <Text className="text-content text-default-1 mb-1 font-bold">{t("circuits.form.structured")}</Text>
                      <Text className="text-muted text-default-3">{t("circuits.form.structuredDesc")}</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setExecutionMode("semi-estruturado")}
                      className={`flex-1 p-3.5 rounded-xl border ${executionMode === "semi-estruturado" ? "border-primary bg-primary/10" : "border-outline bg-level1"
                        }`}
                    >
                      <Text className="text-content text-default-1 mb-1 font-bold">{t("circuits.form.semi")}</Text>
                      <Text className="text-muted text-default-3">{t("circuits.form.semiDesc")}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View>
                <Pressable 
                  onPress={() => setIsTagFilterOpen((prev) => !prev)}
                  className="flex-row items-center p-3.5 bg-level1 border border-outline rounded-[15px] mb-4 gap-3"
                >
                  <Tags size={24} color={colors.muted} />
                  <Text className="text-muted text-[14px] leading-[20px] font-medium">
                    {t("circuits.form.selectByTag")}
                  </Text>
                </Pressable>

                {isTagFilterOpen && (
                  <View className="mb-4">
                    <TagGroup
                      availableTags={availableTags}
                      availableSubtags={availableSubtags}
                      mode="multiple"
                      selectedTags={selectedTags}
                      selectedSubtags={selectedSubtags}
                      onChangeTags={setSelectedTags}
                      onChangeSubtags={setSelectedSubtags}
                    />
                  </View>
                )}

                <View ref={exercisesFieldRef} collapsable={false} className="gap-2">
                  <Text className="text-muted text-default-1">{t("circuits.form.selectExercises")}</Text>
                  <ScrollView
                    style={{ maxHeight: Math.min(260, screenHeight * 0.3) }}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <View className="gap-2.5">
                      {filteredExercises.map((ex: Exercise) => (
                        <SelectableChip
                          key={ex.id}
                          label={ex.name}
                          isSelected={orderedExercises.some((o) => o.id === ex.id)}
                          onToggle={() => handleToggleExercise(ex)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>
                {errors.exercises ? (
                  <Text className="text-error text-default-3 mt-1 ml-1">{errors.exercises}</Text>
                ) : null}
              </View>
            </View>

            {executionMode === "estruturado" && orderedExercises.length > 0 && (
              <View ref={reorderFieldRef} collapsable={false} className="mt-2">
                <Text className="text-content text-default-1 mb-1 font-bold">{t("circuits.form.order")}</Text>
                <Text className="text-muted text-default-3 mb-4">
                  {t("circuits.form.orderHint")}
                </Text>
                <DraggableList
                  items={orderedExercises.map((ex) => ({ id: ex.id, name: ex.name }))}
                  onReorder={(sorted) => {
                    setOrderedExercises(
                      sorted.map((s) => orderedExercises.find((ex) => ex.id === s.id)!),
                    );
                    sim.complete("reorder");
                  }}
                  onDragActiveChange={setIsDragging}
                />
              </View>
            )}
          </ScrollView>


          <View className="flex-row justify-between gap-3 p-5">
            <ActionButtons
              onCancel={onClose}
              onSave={handleValidationAndSave}
              cancelLabel={t("common.cancel")}
              saveLabel={isSaving ? t("common.saving") : t("common.save")}
              disabled={isSaving}
              saveButtonRef={saveFieldRef}
            />
          </View>

          <TutorialSpotlight />
        </View>
      </View>
    </AppModal>
  );
}