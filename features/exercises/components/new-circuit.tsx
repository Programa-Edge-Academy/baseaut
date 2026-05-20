import React, { useEffect, useRef, useState } from "react";
import { Modal, Text, View, Pressable, useWindowDimensions, FlatList, ActivityIndicator } from "react-native";
import { ChevronDown, ChevronUp, X, CheckCircle2 } from "lucide-react-native";

import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { SelectableChip } from "@/components/selectable-chip";
import { DropdownModal } from "@/components/dropdown-modal";
import { useExercises, Exercise } from "../hooks/use-exercises";
import { useForms } from "../hooks/use-forms";

type ExecutionMode = "estruturado" | "livre";

/**
 * Properties expected by the NewCircuit component.
 */
interface NewCircuitProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  initialData?: {
    name: string;
    executionMode: ExecutionMode;
    form: string | null;
    exercises: Exercise[];
  };
  onSave: (data: { 
    name: string; 
    type: "padrão" | "mabc_1" | "mabc_2" | "mabc_3"; 
    executionMode: ExecutionMode; 
    form: string | null; 
    exercises: Exercise[] 
  }) => Promise<void>;
}

export function NewCircuit({ 
  visible, 
  onClose, 
  onSave,
  title = "Novo circuito",
  initialData
}: NewCircuitProps) {
  const { exercises } = useExercises();
  const { forms, isLoading: isLoadingForms } = useForms();
  const { height: screenHeight } = useWindowDimensions();

  const [name, setName] = useState("");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("estruturado");
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [orderedExercises, setOrderedExercises] = useState<Exercise[]>([]);

  const [activeSortItemId, setActiveSortItemId] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    name: "",
    form: "",
    exercises: ""
  });
  
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });
  const formTriggerRef = useRef<View>(null);

  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Freeze the title while the modal is open so it never flickers to "Novo circuito"
  // during the closing animation after circuitToEdit is set to null in the parent.
  const frozenTitle = useRef(title);

  const isEditing = !!initialData;
  const successMessage = isEditing ? "Circuito editado com sucesso" : "Circuito criado com sucesso";

  useEffect(() => {
    if (visible) {
      frozenTitle.current = title;
      if (initialData) {
        setName(initialData.name);
        setExecutionMode(initialData.executionMode);
        setSelectedForm(initialData.form);
        setOrderedExercises(initialData.exercises || []);
      } else {
        setName("");
        setExecutionMode("estruturado");
        setSelectedForm(null);
        setOrderedExercises([]);
      }
      setErrors({ name: "", form: "", exercises: "" });
      setActiveSortItemId(null);
      setShowToast(false);
      setIsSaving(false);
    }
  }, [visible, initialData]);

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

  const handleOpenDropdown = () => {
    formTriggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownLayout({
        top: pageY + height + 5,
        left: pageX,
        width: width,
      });
      setIsDropdownVisible(true);
    });
  };

  const handleSelectForm = (val: string) => {
    setSelectedForm(val);
    if (errors.form) setErrors(prev => ({ ...prev, form: "" }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return; 
    setOrderedExercises((prev) => {
      const updatedList = [...prev];
      const targetItem = updatedList[index];
      updatedList[index] = updatedList[index - 1];
      updatedList[index - 1] = targetItem;
      return updatedList;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedExercises.length - 1) return; 
    setOrderedExercises((prev) => {
      const updatedList = [...prev];
      const targetItem = updatedList[index];
      updatedList[index] = updatedList[index + 1];
      updatedList[index + 1] = targetItem;
      return updatedList;
    });
  };

  const handleValidationAndSave = async () => {
    let isValid = true;
    const newErrors = { name: "", form: "", exercises: "" };

    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = "Este campo é obrigatório";
      isValid = false;
    }

    // Formulário só é obrigatório se existirem formulários disponíveis
    if (forms.length > 0 && !selectedForm) {
      newErrors.form = "É obrigatório selecionar um formulário.";
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
        type: "padrão", 
        executionMode: executionMode, 
        // 🧪 MOCK — não envia o formulário ao banco durante testes
        // ⬇️ Substituir por `form: selectedForm` quando o banco tiver formulários reais
        form: null,
        // form: selectedForm,
        exercises: orderedExercises 
      });
      // Only show the toast after a confirmed successful save
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (err) {
      // onSave re-throws on error; keep the modal open so the user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const renderOrderItem = ({ item, index }: { item: Exercise; index: number }) => {
    const displayIndex = index + 1;
    const isArrowsPanelVisible = activeSortItemId === item.id;
    
    return (
      <View className="mb-2.5">
        <View 
          className={`flex-row items-center justify-between bg-level1 border rounded-[10px] px-3.5 py-3 ${
            isArrowsPanelVisible ? "border-primary shadow-panelShadow" : "border-outline"
          }`}
        >
          <Pressable 
            onPress={() => setActiveSortItemId(prev => prev === item.id ? null : item.id)}
            className="flex-1 py-1 mr-2"
          >
            <Text className="text-white text-default-2" numberOfLines={2}>
              {displayIndex}. {item.name}
            </Text>
          </Pressable>

          {isArrowsPanelVisible && (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
                className={`p-1 rounded active:opacity-60 ${index === 0 ? "opacity-30" : ""}`}
              >
                <ChevronUp size={22} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => handleMoveDown(index)}
                disabled={index === orderedExercises.length - 1}
                className={`p-1 rounded active:opacity-60 ${index === orderedExercises.length - 1 ? "opacity-30" : ""}`}
              >
                <ChevronDown size={22} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  const headerContent = (
    <View className="gap-5 mb-5">
      <View>
        <DefaultTextInput
          value={name}
          maxLength={20} 
          onChangeText={(val) => {
            setName(val);
            if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
          }}
          placeholder="Nome do circuito"
          className={errors.name ? "border-error" : ""} 
        />
        {errors.name ? (
          <Text className="text-error text-default-3 mt-1 ml-1">{errors.name}</Text>
        ) : null}
      </View>

      <View>
        <Text className="text-muted text-default-2 mb-2">Tipo do circuito</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setExecutionMode("estruturado")}
            className={`flex-1 p-3.5 rounded-xl border ${
              executionMode === "estruturado" ? "border-primary bg-primary/10" : "border-outline bg-level1"
            }`}
          >
            <Text className="text-white text-default-1 mb-1 font-bold">Estruturado</Text>
            <Text className="text-muted text-default-3">Realiza todos os exercícios definidos</Text>
          </Pressable>

          <Pressable
            onPress={() => setExecutionMode("livre")}
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
        <Text className="text-muted text-default-2 mb-2">Formulário da sessão</Text>
        <View ref={formTriggerRef} collapsable={false}>
          <Pressable
            onPress={handleOpenDropdown}
            disabled={isLoadingForms || forms.length === 0}
            className={`flex-row items-center justify-between bg-level2 border rounded-[10px] px-3.5 py-3 ${
              errors.form ? "border-error" : "border-outline"
            } ${isLoadingForms || forms.length === 0 ? "opacity-50" : ""}`}
          >
            <Text className={`text-default-2 ${selectedForm ? "text-white" : "text-muted"}`}>
              {isLoadingForms
                ? "Carregando formulários..."
                : forms.length === 0
                ? "Nenhum formulário disponível"
                : (forms.find((f) => f.id === selectedForm)?.titulo ?? "Selecione um formulário")}
            </Text>
            <ChevronDown color={colors.muted} size={20} />
          </Pressable>
          {errors.form ? (
            <Text className="text-error text-default-3 mt-1 ml-1">{errors.form}</Text>
          ) : null}
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

      {executionMode === "estruturado" && orderedExercises.length > 0 && (
        <Text className="text-muted text-default-2 mt-2">Ordem (clique para reordenar)</Text>
      )}
    </View>
  );

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

          <FlatList
            data={executionMode === "estruturado" ? orderedExercises : []}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            ListHeaderComponent={headerContent}
            showsVerticalScrollIndicator={false}
            className="flex-shrink"
            contentContainerStyle={{ padding: 20 }}
          />

          <View className="flex-row justify-between gap-3 p-5 border-t border-outline/30 bg-level2">
            <DefaultButton
              label="Cancelar"
              onPress={onClose}
              disabled={isSaving}
              bgColorClass="bg-level2"
              isOutline
              hasShadow={false}
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              className="flex-1"
            />
            <DefaultButton
              label={isSaving ? "Salvando..." : "Salvar"}
              onPress={handleValidationAndSave}
              disabled={isSaving}
              className="flex-1"
            />
          </View>
        </View>
      </View>

      <DropdownModal
        visible={isDropdownVisible}
        onClose={() => setIsDropdownVisible(false)}
        options={forms.map((f) => f.titulo)}
        selectedValue={forms.find((f) => f.id === selectedForm)?.titulo ?? null}
        onSelect={(titulo) => {
          const form = forms.find((f) => f.titulo === titulo);
          if (form) handleSelectForm(form.id);
        }}
        layout={dropdownLayout}
      />
    </Modal>
  );
}