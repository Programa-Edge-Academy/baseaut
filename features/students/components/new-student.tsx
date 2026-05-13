import { colors } from "@/assets/colors";
import { Calendar, ChevronDown, ImageUp, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ActionButtons } from "../../../components/action-buttons";
import { DefaultTextInput } from "../../../components/default-text-input";
import { DropdownModal } from "../../../components/dropdown-modal";

/**
 * Props for the NewStudent modal component.
 */
export type NewStudentProps = {
  visible?: boolean;
  borderRadius?: number;
  onClose: () => void;
  handlePhotoPress: () => void;
  // TODO: Update this signature to pass the validated data payload back to the parent (e.g., onSave: (data: StudentData) => void)
  onSave: () => void; 
};

export function NewStudent({
  visible,
  onClose,
  borderRadius = 15,
  handlePhotoPress,
  onSave,
}: NewStudentProps) {
  // --- Form Data State ---
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [supportLevel, setSupportLevel] = useState<string | null>(null);
  const [healthConditions, setHealthConditions] = useState("");
  const [observations, setObservations] = useState("");

  // --- Validation State ---
  // Stores error messages mapped by the respective field name
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- UI & Layout State ---
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Reference and layout state to precisely position the absolute dropdown modal below the trigger button
  const supportLevelRef = useRef<View>(null);
  const [supportLevelLayout, setSupportLevelLayout] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const supportLevelOptions = [
    "Transtorno do Espectro Autista Nível 1",
    "Transtorno do Espectro Autista Nível 2",
    "Transtorno do Espectro Autista Nível 3",
  ];

  /**
   * Calculates the exact screen position of the support level dropdown button
   * to render the absolute modal in the correct place, regardless of scroll position.
   */
  const openSupportLevelDropdown = () => {
    supportLevelRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSupportLevelLayout({ top: pageY + height, left: pageX, width });
      setDropdownVisible(true);
    });
  };

  // --- Date Picker Handlers ---
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  /**
   * Handles the date selection from the native date picker modal.
   * Formats the selected Date object to a DD/MM/YYYY string.
   */
  const handleConfirmDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    setBirthDate(`${day}/${month}/${year}`);

    // Clear validation error if present upon successful selection
    setErrors((prev) => ({ ...prev, birthDate: "" }));
    hideDatePicker();
  };

  /**
   * Input mask for birth date (DD/MM/YYYY).
   * Automatically formats the string as the user types.
   */
  const handleBirthDateChange = (text: string) => {
    // Strip all non-numeric characters
    let numericText = text.replace(/\D/g, "");
    if (numericText.length > 8) numericText = numericText.slice(0, 8);

    // Apply the DD/MM/YYYY mask
    let formattedText = numericText;
    if (numericText.length > 4) {
      formattedText = `${numericText.slice(0, 2)}/${numericText.slice(2, 4)}/${numericText.slice(4)}`;
    } else if (numericText.length > 2) {
      formattedText = `${numericText.slice(0, 2)}/${numericText.slice(2)}`;
    }
    setBirthDate(formattedText);

    // Clear validation error smoothly as the user types
    if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
  };

  // --- Measurement Formatting Handlers (UX enhancements) ---
  // These functions append units on blur and remove them on focus,
  // allowing the user to edit purely numeric values without fighting the cursor.

  const handleWeightBlur = () => {
    const numericWeight = weight.replace(/[^\d.,]/g, "").trim();
    if (numericWeight) setWeight(`${numericWeight} Kg`);
  };

  const handleWeightFocus = () => {
    setWeight(weight.replace(/ Kg/g, "").trim());
  };

  const handleHeightBlur = () => {
    const numericHeight = height.replace(/[^\d.,]/g, "").trim();
    if (numericHeight) setHeight(`${numericHeight} Cm`);
  };

  const handleHeightFocus = () => {
    setHeight(height.replace(/ Cm/g, "").trim());
  };

  // --- Form Validation ---
  /**
   * Validates all form fields against the defined business rules.
   * Updates the `errors` state object with specific messages for each invalid field.
   * @returns {boolean} True if the form is valid (no errors), false otherwise.
   */
  const validateForm = (): boolean => {
    let newErrors: Record<string, string> = {};

    // 1. Full Name Validation
    const nameTrimmed = fullName.trim();
    if (!nameTrimmed) {
      newErrors.fullName = "Campo obrigatório.";
    } else if (nameTrimmed.length < 3) {
      newErrors.fullName = "Deve ter no mínimo 3 caracteres.";
    } else if (!nameTrimmed.includes(" ")) {
      newErrors.fullName = "Informe nome e sobrenome."; // Requires at least one space (First + Last name)
    }

    // 2. Birth Date Validation
    if (!birthDate.trim()) {
      newErrors.birthDate = "Campo obrigatório.";
    } else {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (!match) {
        newErrors.birthDate = "Data de nascimento inválida.";
      } else {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();

        // Ensure date exists on the calendar (e.g., blocks 31/02) and is not a future date
        if (
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() !== month - 1 ||
          dateObj.getDate() !== day ||
          dateObj > today
        ) {
          newErrors.birthDate = "Data de nascimento inválida.";
        }
      }
    }

    // 3. Weight Validation
    if (!weight.trim()) {
      newErrors.weight = "Campo obrigatório.";
    } else {
      const numericWeight = weight.replace(/[^\d.]/g, ""); // Keep only digits and decimal dot
      const parsedWeight = Number(numericWeight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        newErrors.weight = "Formato inválido.";
      }
    }

    // 4. Height Validation
    if (!height.trim()) {
      newErrors.height = "Campo obrigatório.";
    } else {
      const numericHeight = height.replace(/[^\d.]/g, ""); // Keep only digits and decimal dot
      const parsedHeight = Number(numericHeight);
      if (isNaN(parsedHeight) || parsedHeight <= 0) {
        newErrors.height = "Formato inválido.";
      }
    }

    // 5. Support Level Validation
    if (!supportLevel) {
      newErrors.supportLevel = "Campo obrigatório.";
    }

    setErrors(newErrors);

    // Return true only if the errors object is empty
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Wrapper for the save action. Prevents execution if validation fails.
   */
  const handleSaveWrapper = () => {
    if (validateForm()) {
      onSave();
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 p-[25px]">
        <ScrollView
          className="border bg-level2 border-outline"
          style={{ borderRadius }}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <View className="p-[25px] gap-[20px]">
            
            {/* --- Header --- */}
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-white">Novo aluno</Text>
              <Pressable onPress={onClose}>
                <X color={colors.muted} size={30} />
              </Pressable>
            </View>

            {/* --- Profile Photo Upload --- */}
            <View className="items-center">
              <Pressable
                onPress={handlePhotoPress}
                className="w-[100px] h-[100px] bg-outline items-center justify-center rounded-[15px]"
              >
                <ImageUp color={colors.muted} size={50} />
              </Pressable>
            </View>

            {/* --- Form Fields --- */}
            
            {/* Full Name Input */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">Nome completo*</Text>
              <DefaultTextInput
                placeholder="Nome do aluno"
                className={`h-[44px] ${errors.fullName ? "border-red-500" : ""}`}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({ ...errors, fullName: "" });
                }}
                maxLength={100}
              />
              {errors.fullName && (
                <Text className="text-red-500 text-xs">{errors.fullName}</Text>
              )}
            </View>

            {/* Birth Date Input */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">
                Data de nascimento*
              </Text>
              <View className="relative">
                <DefaultTextInput
                  placeholder="DD/MM/AAAA"
                  className={`h-[44px] pr-[50px] ${errors.birthDate ? "border-red-500" : ""}`}
                  value={birthDate}
                  onChangeText={handleBirthDateChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <View className="absolute right-[15px] top-[12px]">
                  <Pressable onPress={showDatePicker}>
                    <Calendar color={colors.muted} size={20} />
                  </Pressable>
                </View>
              </View>
              {errors.birthDate && (
                <Text className="text-red-500 text-xs">{errors.birthDate}</Text>
              )}

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                confirmTextIOS="Confirmar"
                cancelTextIOS="Cancelar"
                maximumDate={new Date()}
              />
            </View>

            {/* Weight and Height Inputs */}
            <View className="flex-row gap-[10px]">
              {/* Weight */}
              <View className="flex-1 gap-2">
                <Text className="text-muted text-default-1">Peso*</Text>
                <DefaultTextInput
                  placeholder="Peso (Kg)"
                  className={`h-[44px] ${errors.weight ? "border-red-500" : ""}`}
                  value={weight}
                  onChangeText={(text) => {
                    // Silently replace commas with dots to ensure numeric consistency
                    const formattedText = text.replace(/,/g, ".");
                    setWeight(formattedText);
                    if (errors.weight) setErrors({ ...errors, weight: "" });
                  }}
                  onBlur={handleWeightBlur}
                  onFocus={handleWeightFocus}
                  keyboardType="decimal-pad"
                />
                {errors.weight && <Text className="text-red-500 text-xs">{errors.weight}</Text>}
              </View>
              
              {/* Height */}
              <View className="flex-1 gap-2">
                <Text className="text-muted text-default-1">Altura*</Text>
                <DefaultTextInput
                  placeholder="Altura (Cm)"
                  className={`h-[44px] ${errors.height ? "border-red-500" : ""}`}
                  value={height}
                  onChangeText={(text) => {
                    // Silently replace commas with dots to ensure numeric consistency
                    const formattedText = text.replace(/,/g, ".");
                    setHeight(formattedText);
                    if (errors.height) setErrors({ ...errors, height: "" });
                  }}
                  onBlur={handleHeightBlur}
                  onFocus={handleHeightFocus}
                  keyboardType="decimal-pad"
                />
                {errors.height && <Text className="text-red-500 text-xs">{errors.height}</Text>}
              </View>
            </View>

            {/* Support Level Dropdown */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">
                Nível de suporte*
              </Text>
              <Pressable
                ref={supportLevelRef}
                collapsable={false}
                onPress={openSupportLevelDropdown}
                className={`h-[44px] bg-level2 border rounded-[10px] px-[12px] flex-row items-center justify-between ${
                  errors.supportLevel ? "border-red-500" : "border-outline"
                }`}
              >
                <Text
                  className={`text-default-1 ${supportLevel ? "text-white" : "text-muted"}`}
                >
                  {supportLevel || "Selecione aqui"}
                </Text>
                <ChevronDown color={colors.muted} size={20} />
              </Pressable>
              {errors.supportLevel && (
                <Text className="text-red-500 text-xs">
                  {errors.supportLevel}
                </Text>
              )}
            </View>

            <DropdownModal
              visible={dropdownVisible}
              onClose={() => setDropdownVisible(false)}
              onSelect={(option) => {
                setSupportLevel(option);
                if (errors.supportLevel)
                  setErrors({ ...errors, supportLevel: "" });
              }}
              options={supportLevelOptions}
              selectedValue={supportLevel}
              layout={supportLevelLayout}
            />

            {/* Health Conditions Input */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">
                Outras condições de saúde
              </Text>
              <DefaultTextInput
                placeholder="Outras condições de saúde (opcional)"
                className="h-[80px]"
                multiline
                maxLength={100}
                value={healthConditions}
                onChangeText={setHealthConditions}
              />
              <Text className="text-muted text-xs">
                {healthConditions.length}/100
              </Text>
            </View>

            {/* Observations Input */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">Observações</Text>
              <DefaultTextInput
                placeholder="Observações (opcionais)"
                className="h-[44px]"
                maxLength={100}
                value={observations}
                onChangeText={setObservations}
              />
            </View>

            {/* --- Footer / Actions --- */}
            <ActionButtons
              onCancel={onClose}
              onSave={handleSaveWrapper} // Executes validation before saving
              cancelLabel="Cancelar"
              saveLabel="Salvar"
              className="mt-[10px]"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}