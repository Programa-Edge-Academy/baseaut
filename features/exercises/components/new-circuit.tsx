import React, { useEffect, useRef, useState } from "react";
import { Modal, Text, View, Pressable, useWindowDimensions, ScrollView, StyleSheet } from "react-native";
import { X, CheckCircle2 } from "lucide-react-native";
import { ActionButtons } from "@/components/action-buttons";
import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { SelectableChip } from "@/components/selectable-chip";
import { useExercises, Exercise } from "../hooks/use-exercises";

type ExecutionMode = "estruturado" | "livre";

interface NewCircuitProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  initialData?: {
    name: string;
    executionMode: ExecutionMode;
    exercises: Exercise[];
  };
  onSave: (data: { 
    name: string; 
    type: "padrao" | "mabc_1" | "mabc_2" | "mabc_3"; 
    executionMode: ExecutionMode; 
    exercises: Exercise[] 
  }) => Promise<void>;
}

const SwapItem = React.memo(({ item, index, isSelected, onPress }: { 
  item: Exercise, 
  index: number, 
  isSelected: boolean, 
  onPress: () => void 
}) => (
  <Pressable 
    style={[STYLES.swapItem, isSelected && STYLES.swapItemSelected]}
    onPress={onPress}
  >
    <View style={[STYLES.swapNumberBox, isSelected && STYLES.swapNumberBoxSelected]}>
      <Text style={STYLES.swapNumberText}>{index + 1}</Text>
    </View>
    <Text style={[STYLES.swapItemName, isSelected && STYLES.swapItemNameSelected]} numberOfLines={2}>
      {item.name}
    </Text>
    {isSelected && <Text style={STYLES.swapHelperText}>Trocar com...</Text>}
  </Pressable>
));

const STYLES = StyleSheet.create({
  swapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.level1,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  swapItemSelected: {
    borderColor: colors.primary,
    backgroundColor: withOpacity(colors.primary, 0.15),
  },
  swapNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  swapNumberBoxSelected: {
    backgroundColor: colors.primary,
  },
  swapNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  swapItemName: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  swapItemNameSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  swapHelperText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export function NewCircuit({ 
  visible, 
  onClose, 
  onSave,
  title = "Novo circuito",
  initialData
}: NewCircuitProps) {
  const { exercises } = useExercises();
  const { height: screenHeight } = useWindowDimensions();

  const [name, setName] = useState("");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("estruturado");
  const [orderedExercises, setOrderedExercises] = useState<Exercise[]>([]);

  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  const [errors, setErrors] = useState({
    name: "",
    exercises: ""
  });
  
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const frozenTitle = useRef(title);

  const isEditing = !!initialData;
  const successMessage = isEditing ? "Circuito editado com sucesso" : "Circuito criado com sucesso";

  useEffect(() => {
    if (visible) {
      frozenTitle.current = title;
      if (initialData) {
        setName(initialData.name);
        setExecutionMode(initialData.executionMode);
        setOrderedExercises(initialData.exercises || []);
      } else {
        setName("");
        setExecutionMode("estruturado");
        setOrderedExercises([]);
      }
      setErrors({ name: "", exercises: "" });
      setSwapIndex(null);
      setShowToast(false);
      setIsSaving(false);
    }
  }, [visible, initialData]);

  const handleToggleExercise = (exercise: Exercise) => {
    if (errors.exercises) setErrors(prev => ({ ...prev, exercises: "" }));
    setSwapIndex(null);

    setOrderedExercises((prev) => {
      const isAlreadySelected = prev.some((e) => e.id === exercise.id);
      if (isAlreadySelected) {
        return prev.filter((e) => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

const handleSwapClick = React.useCallback((index: number) => {
  if (swapIndex === null) {
    setSwapIndex(index);
  } else if (swapIndex === index) {
    setSwapIndex(null);
  } else {
    setOrderedExercises((prev) => {
      const newList = [...prev];
      const temp = newList[swapIndex];
      newList[swapIndex] = newList[index];
      newList[index] = temp;
      return newList;
    });
    setSwapIndex(null);
  }
}, [swapIndex]);

  const handleValidationAndSave = async () => {
    let isValid = true;
    const newErrors = { name: "", exercises: "" };

    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = "Este campo é obrigatório";
      isValid = false;
    }

    if (orderedExercises.length === 0) {
      newErrors.exercises = "É obrigatória a seleção de pelo menos um exercício";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    setIsSaving(true);
    try {
      await onSave({ 
        name: trimmedName, 
        type: "padrao", 
        executionMode: executionMode, 
        exercises: orderedExercises 
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View 
          className="bg-level2 border border-outline rounded-xl w-[90%] max-w-[900px] overflow-hidden relative"
          style={{ maxHeight: screenHeight * 0.85 }}
        >
          {showToast && (
            <View className="absolute top-5 left-5 right-5 z-50 bg-level1 border border-primary rounded-xl p-4 shadow-panelShadow flex-row items-center">
              <CheckCircle2 color={colors.primary} size={24} />
              <Text className="text-white text-default-1 ml-3 flex-1">
                {successMessage}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
            <Text className="text-white text-header-2">{frozenTitle.current}</Text>
            <Pressable onPress={onClose} disabled={isSaving} className="p-1 active:opacity-70">
              <X size={24} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView 
            className="flex-shrink" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20 }}
          >
            <View className="gap-5 mb-5">
              <View>
                <DefaultTextInput
                  value={name}
                  maxLength={20} 
                  onChangeText={(val) => {
                    const cleanVal = val.replace(/\d/g, "");
                    setName(cleanVal);
                    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                  }}
                  placeholder="Nome do circuito"
                  outLineBorderClass={errors.name ? "border-error" : ""} 
                />
                {errors.name ? (
                  <Text className="text-error text-default-3 mt-1 ml-1">{errors.name}</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-muted text-default-2 mb-2">Tipo do circuito</Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setExecutionMode("estruturado");
                      setSwapIndex(null);
                    }}
                    className={`flex-1 p-3.5 rounded-xl border ${
                      executionMode === "estruturado" ? "border-primary bg-primary/10" : "border-outline bg-level1"
                    }`}
                  >
                    <Text className="text-white text-default-1 mb-1 font-bold">Estruturado</Text>
                    <Text className="text-muted text-default-3">Realiza todos os exercícios definidos</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setExecutionMode("livre");
                      setSwapIndex(null);
                    }}
                    className={`flex-1 p-3.5 rounded-xl border ${
                      executionMode === "livre" ? "border-primary bg-primary/10" : "border-outline bg-level1"
                    }`}
                  >
                    <Text className="text-white text-default-1 mb-1 font-bold">Livre</Text>
                    <Text className="text-muted text-default-3">Para engajamento e atividades parciais</Text>
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="text-muted text-default-2 mb-2">Selecione os exercícios</Text>
                <View className="gap-2.5">
                  {exercises.map((ex: Exercise) => (
                    <SelectableChip
                      key={ex.id}
                      label={ex.name}
                      isSelected={orderedExercises.some((o) => o.id === ex.id)}
                      onToggle={() => handleToggleExercise(ex)}
                    />
                  ))}
                </View>
                {errors.exercises ? (
                  <Text className="text-error text-default-3 mt-1 ml-1">{errors.exercises}</Text>
                ) : null}
              </View>
            </View>

            {executionMode === "estruturado" && orderedExercises.length > 0 && (
              <View className="mt-2">
                <Text className="text-white text-default-1 mb-1 font-bold">Ordem do Circuito</Text>
                <Text className="text-muted text-default-3 mb-4">
                  Toque em um exercício e depois em outro para trocar suas posições.
                </Text>

                {orderedExercises.map((item, index) => (
                  <SwapItem 
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={swapIndex === index}
                    onPress={() => handleSwapClick(index)}
                  />
                ))}
              </View>
            )}
          </ScrollView>


          <View className="flex-row justify-between gap-3 p-5">
            <ActionButtons
              onCancel={onClose}
              onSave={handleValidationAndSave}
              cancelLabel="Cancelar"
              saveLabel={isSaving ? "Salvando..." : "Salvar"}
              disabled={isSaving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}