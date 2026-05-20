import React, { useRef, useState } from "react";
import { Modal, Text, View, Pressable } from "react-native";
import { ChevronDown, GripVertical, X, CheckCircle2 } from "lucide-react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { SelectableChip } from "@/components/selectable-chip";
import { DropdownModal } from "@/components/dropdown-modal";
import { useExercises, Exercise } from "../hooks/use-exercises";

type CircuitType = "estruturado" | "livre";

interface NewCircuitModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  onSave: (data: { name: string; type: CircuitType; form: string | null; exercises: Exercise[] }) => void;
}

export function NewCircuitModal({ 
  visible, 
  onClose, 
  onSave,
  title = "Novo circuito" 
}: NewCircuitModalProps) {
  const { exercises } = useExercises();

  const [name, setName] = useState("");
  const [circuitType, setCircuitType] = useState<CircuitType>("estruturado");
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [orderedExercises, setOrderedExercises] = useState<Exercise[]>([]);

  const [errors, setErrors] = useState({
    name: "",
    form: "",
    exercises: ""
  });
  
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });
  const formTriggerRef = useRef<View>(null);

  const [showToast, setShowToast] = useState(false);

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

  const handleValidationAndSave = () => {
    let isValid = true;
    const newErrors = { name: "", form: "", exercises: "" };

    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = "Este campo é obrigatório";
      isValid = false;
    }

    if (!selectedForm) {
      newErrors.form = "É obrigatório selecionar um formulário.";
      isValid = false;
    }

    if (orderedExercises.length === 0) {
      newErrors.exercises = "É obrigatória a seleção de pelo menos um exercício";
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setShowToast(true);
      
      setTimeout(() => {
        setShowToast(false);
        onSave({ name: trimmedName, type: circuitType, form: selectedForm, exercises: orderedExercises });
      }, 1500);
    }
  };

  const renderDraggableItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Exercise>) => {
    const index = getIndex() !== undefined ? getIndex()! + 1 : "-";
    
    return (
      <ScaleDecorator>
        <View className="mb-2.5">
          <View
            className={`flex-row items-center bg-level1 border rounded-[10px] px-3.5 py-3 ${
              isActive ? "opacity-70 border-primary shadow-panelShadow" : "border-outline"
            }`}
          >
            <Pressable
              onLongPress={drag}
              delayLongPress={150} 
              disabled={isActive}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="mr-3"
            >
              <GripVertical size={20} color={isActive ? colors.primary : colors.muted} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-default-2" numberOfLines={2}>
                {index}. {item.name}
              </Text>
            </View>
          </View>
        </View>
      </ScaleDecorator>
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
            onPress={() => setCircuitType("estruturado")}
            className={`flex-1 p-3.5 rounded-xl border ${
              circuitType === "estruturado" ? "border-primary bg-primary/10" : "border-outline bg-level1"
            }`}
          >
            <Text className="text-white text-default-1 mb-1">Estruturado</Text>
            <Text className="text-muted text-default-3">Realiza todos os exercícios definidos</Text>
          </Pressable>

          <Pressable
            onPress={() => setCircuitType("livre")}
            className={`flex-1 p-3.5 rounded-xl border ${
              circuitType === "livre" ? "border-primary bg-primary/10" : "border-outline bg-level1"
            }`}
          >
            <Text className="text-white text-default-1 mb-1">Livre</Text>
            <Text className="text-muted text-default-3">Para engajamento e atividades parciais</Text>
          </Pressable>
        </View>
      </View>

      <View>
        <Text className="text-muted text-default-2 mb-2">Formulário da sessão</Text>
        <View ref={formTriggerRef} collapsable={false}>
          <Pressable
            onPress={handleOpenDropdown}
            className={`flex-row items-center justify-between bg-level2 border rounded-[10px] px-3.5 py-3 ${
              errors.form ? "border-error" : "border-outline"
            }`}
          >
            <Text className={`text-default-2 ${selectedForm ? "text-white" : "text-muted"}`}>
              {selectedForm || "Selecione um formulário"}
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

      {circuitType === "estruturado" && orderedExercises.length > 0 && (
        <Text className="text-muted text-default-2 mt-2">Ordem (arraste para reordenar)</Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView className="flex-1 bg-black/60 justify-center items-center">
        
        <View className="bg-level2 border border-outline rounded-2xl w-[90%] max-w-[500px] h-[85%] overflow-hidden relative">
          
          {showToast && (
            <View className="absolute top-5 left-5 right-5 z-50 bg-level1 border border-primary rounded-xl p-4 shadow-panelShadow flex-row items-center">
              <CheckCircle2 color={colors.primary} size={24} />
              <Text className="text-white text-default-1 ml-3 flex-1">
                Circuito criado com sucesso!
              </Text>
            </View>
          )}

          <View className="flex-row justify-between items-center p-5 border-b border-outline/30">
            <Text className="text-white text-header-2">{title}</Text>
            <Pressable onPress={onClose} className="p-1 active:opacity-70">
              <X size={24} color={colors.muted} />
            </Pressable>
          </View>

          <View className="flex-1 p-5">
            <DraggableFlatList
              data={circuitType === "estruturado" ? orderedExercises : []}
              onDragEnd={({ data }) => setOrderedExercises(data)}
              keyExtractor={(item) => item.id}
              renderItem={renderDraggableItem}
              ListHeaderComponent={headerContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>

          <View className="flex-row justify-between gap-3 p-5 border-t border-outline/30 bg-level2">
            <DefaultButton
              label="Cancelar"
              onPress={onClose}
              bgColorClass="bg-level2"
              isOutline
              hasShadow={false}
              outlineBorderClass="border-outline"
              textClassName="text-muted"
              className="flex-1"
            />
            <DefaultButton
              label="Salvar"
              onPress={handleValidationAndSave}
              className="flex-1"
            />
          </View>

        </View>

        <DropdownModal
          visible={isDropdownVisible}
          onClose={() => setIsDropdownVisible(false)}
          options={["Formulário 1", "Formulário 2", "Formulário de Avaliação"]}
          selectedValue={selectedForm}
          onSelect={handleSelectForm}
          layout={dropdownLayout}
        />

      </GestureHandlerRootView>
    </Modal>
  );
}