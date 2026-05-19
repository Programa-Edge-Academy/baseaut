import { colors } from "@/assets/colors";
import { Calendar, ChevronDown, ImageUp, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, Image } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ActionButtons } from "../../../components/action-buttons";
import { DefaultTextInput } from "../../../components/default-text-input";
import { DropdownModal } from "../../../components/dropdown-modal";
import { ConfirmationModal } from "../../../components/confirmation-modal";
import { StudentData } from "../../teams/hooks/use-team-data";

export type NewStudentProps = {
  visible?: boolean;
  mode?: "create" | "edit";
  initialData?: StudentData | null;
  borderRadius?: number;
  onClose: () => void;
  onSave: (data: Partial<StudentData>, photoUri: string | null) => void;  
};

export function NewStudent({
  visible,
  mode = "create",
  initialData,
  onClose,
  borderRadius = 15,
  onSave,
}: NewStudentProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [supportLevel, setSupportLevel] = useState<string | null>(null);
  const [healthConditions, setHealthConditions] = useState("");
  const [observations, setObservations] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [deletePhotoModalVisible, setDeletePhotoModalVisible] = useState(false);
  
  const supportLevelRef = useRef<View>(null);
  const [supportLevelLayout, setSupportLevelLayout] = useState({ top: 0, left: 0, width: 0 });

  const supportLevelOptions = [
    "Transtorno do Espectro Autista Nível 1",
    "Transtorno do Espectro Autista Nível 2",
    "Transtorno do Espectro Autista Nível 3",
  ];

  useEffect(() => {
    if (visible) {
      setDeletePhotoModalVisible(false);
      if (mode === "edit" && initialData) {
        setFullName(initialData.name);
        setWeight(`${initialData.weight} Kg`);
        setHeight(`${initialData.height} cm`);
        setWaist(`${initialData.waist} cm`);
        setSupportLevel(initialData.supportLevel);
        setHealthConditions(initialData.healthConditions || "");
        setObservations(initialData.observations || "");
        setPhotoUri(initialData.avatarUrl);
        
        if (initialData.birthDate) {
          const [y, m, d] = initialData.birthDate.split("-");
          setBirthDate(`${d}/${m}/${y}`);
        }
      } else {
        setFullName("");
        setBirthDate("");
        setWeight("");
        setHeight("");
        setWaist("");
        setSupportLevel(null);
        setHealthConditions("");
        setObservations("");
        setPhotoUri(null);
      }
      setErrors({});
    }
  }, [visible, mode, initialData]);

  const handlePhotoPress = async () => {
    const ImagePicker = require('expo-image-picker');

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    setBirthDate(`${day}/${month}/${year}`);
    if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
    hideDatePicker();
  };

  const handleBirthDateChange = (text: string) => {
    let numericText = text.replace(/\D/g, "");
    if (numericText.length > 8) numericText = numericText.slice(0, 8);
    let formattedText = numericText;
    if (numericText.length > 4) {
      formattedText = `${numericText.slice(0, 2)}/${numericText.slice(2, 4)}/${numericText.slice(4)}`;
    } else if (numericText.length > 2) {
      formattedText = `${numericText.slice(0, 2)}/${numericText.slice(2)}`;
    }
    setBirthDate(formattedText);
    if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
  };

  const handleWeightBlur = () => {
    const numericWeight = weight.replace(/[^\d.,]/g, "").trim();
    if (numericWeight) setWeight(`${numericWeight} Kg`);
  };

  const handleWeightFocus = () => {
    setWeight(weight.replace(/ Kg/g, "").trim());
    if (errors.weight) setErrors((prev) => ({ ...prev, weight: "" }));
  };

  const handleHeightBlur = () => {
    const numericHeight = height.replace(/[^\d.,]/g, "").trim();
    if (numericHeight) setHeight(`${numericHeight} cm`);
  };

  const handleHeightFocus = () => {
    setHeight(height.replace(/ cm/g, "").trim());
    if (errors.height) setErrors((prev) => ({ ...prev, height: "" }));
  };

  const handleWaistBlur = () => {
    const numericWaist = waist.replace(/[^\d.,]/g, "").trim();
    if (numericWaist) setWaist(`${numericWaist} cm`);
  };

  const handleWaistFocus = () => {
    setWaist(waist.replace(/ cm/g, "").trim());
    if (errors.waist) setErrors((prev) => ({ ...prev, waist: "" }));
  };

  const openSupportLevelDropdown = () => {
    supportLevelRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSupportLevelLayout({ top: pageY + height, left: pageX, width });
      setDropdownVisible(true);
    });
  };

  const validateForm = (): boolean => {
    let newErrors: Record<string, string> = {};

    const nameTrimmed = fullName.trim().replace(/\s+/g, ' ');
    if (!nameTrimmed) {
      newErrors.fullName = "Nome é obrigatório";
    } else if (nameTrimmed.length < 3) {
      newErrors.fullName = "No mínimo 3 caracteres";
    } else if (!nameTrimmed.includes(" ")) {
      newErrors.fullName = "Informe nome e sobrenome";
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = "Data é obrigatória";
    } else {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (!match) {
        newErrors.birthDate = "Data inválida";
      } else {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();

        if (
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() !== month - 1 ||
          dateObj.getDate() !== day ||
          dateObj > today
        ) {
          newErrors.birthDate = "Data irreal ou no futuro";
        }
      }
    }

    if (!weight.trim()) {
      newErrors.weight = "Massa é obrigatória";
    } else {
      const parsedWeight = Number(weight.replace(/[^\d.]/g, ""));
      if (isNaN(parsedWeight) || parsedWeight <= 0) newErrors.weight = "Valor inválido";
    }

    if (!height.trim()) {
      newErrors.height = "Estatura é obrigatória";
    } else {
      const parsedHeight = Number(height.replace(/[^\d.]/g, ""));
      if (isNaN(parsedHeight) || parsedHeight <= 0) newErrors.height = "Valor inválido";
    }

    if (!waist.trim()) {
      newErrors.waist = "Cintura é obrigatória";
    } else {
      const parsedWaist = Number(waist.replace(/[^\d.]/g, ""));
      if (isNaN(parsedWaist) || parsedWaist <= 0) newErrors.waist = "Valor inválido";
    }

    if (!supportLevel) {
      newErrors.supportLevel = "Nível de suporte é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveWrapper = () => {
    if (validateForm()) {
      const cleanName = fullName.trim().replace(/\s+/g, ' ');
      const [day, month, year] = birthDate.split("/");
      const dbDate = `${year}-${month}-${day}`;

      onSave({
        id: initialData?.id,
        name: cleanName,
        birthDate: dbDate,
        weight: Number(weight.replace(/[^\d.]/g, "")),
        height: Number(height.replace(/[^\d.]/g, "")),
        waist: Number(waist.replace(/[^\d.]/g, "")),
        supportLevel: supportLevel!,
        healthConditions: healthConditions.trim(),
        observations: observations.trim(),
        avatarUrl: initialData?.avatarUrl || null,
      }, photoUri);
    }
  };

  return (
    <>
      <Modal visible={visible} onRequestClose={onClose} transparent animationType="fade">
        <View className="flex-1 bg-black/50 p-7 justify-center">
          <View className="border bg-level2 border-outline rounded-[15px]">
            <View className="p-[25px] gap-5">
              
              <View className="flex-row items-center justify-between">
                <Text className="text-header-2 text-white">
                  {mode === "edit" ? "Editar aluno" : "Novo aluno"}
                </Text>
                <Pressable onPress={onClose} className="p-1 active:opacity-70">
                  <X color={colors.muted} size={28} />
                </Pressable>
              </View>

              <View className="items-center">
                <View className="relative">
                  <Pressable
                    onPress={handlePhotoPress}
                    className="w-24 h-24 bg-level1 border border-outline items-center justify-center rounded-2xl overflow-hidden active:opacity-80"
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <ImageUp color={colors.muted} size={40} />
                    )}
                  </Pressable>
                  
                  {photoUri && (
                    <Pressable
                      onPress={() => setDeletePhotoModalVisible(true)}
                      className="absolute -top-2 -right-2 bg-error p-1.5 rounded-full border-2 border-level2 active:opacity-70"
                    >
                      <X color="#FFFFFF" size={14} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Nome completo*</Text>
                <DefaultTextInput
                  placeholder="Nome do aluno"
                  className="h-11 w-full rounded-[15px]"
                  outLineBorderClass={errors.fullName ? "border-error" : "border-outline"}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  maxLength={100}
                />
                {errors.fullName && <Text className="mt-1 text-default-3 text-error">{errors.fullName}</Text>}
              </View>

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Data de nascimento*</Text>
                <View className="relative justify-center">
                  <DefaultTextInput
                    placeholder="DD/MM/AAAA"
                    className="h-11 w-full pr-[50px] rounded-[15px]"
                    outLineBorderClass={errors.birthDate ? "border-error" : "border-outline"}
                    value={birthDate}
                    onChangeText={handleBirthDateChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <Pressable className="absolute right-4" onPress={showDatePicker}>
                    <Calendar color={colors.muted} size={20} />
                  </Pressable>
                </View>
                {errors.birthDate && <Text className="mt-1 text-default-3 text-error">{errors.birthDate}</Text>}

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

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-default-2 text-muted">Massa*</Text>
                  <DefaultTextInput 
                    placeholder="Ex: 30.5" 
                    value={weight} 
                    onChangeText={(text) => setWeight(text.replace(/,/g, "."))} 
                    onBlur={handleWeightBlur}
                    onFocus={handleWeightFocus}
                    keyboardType="decimal-pad"
                    className="h-11 rounded-[15px]"
                    outLineBorderClass={errors.weight ? "border-error" : "border-outline"}
                  />
                  {errors.weight && <Text className="mt-1 text-default-3 text-error">{errors.weight}</Text>}
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-default-2 text-muted">Estatura*</Text>
                  <DefaultTextInput 
                    placeholder="Ex: 120" 
                    value={height} 
                    onChangeText={(text) => setHeight(text.replace(/,/g, "."))} 
                    onBlur={handleHeightBlur}
                    onFocus={handleHeightFocus}
                    keyboardType="decimal-pad"
                    className="h-11 rounded-[15px]"
                    outLineBorderClass={errors.height ? "border-error" : "border-outline"}
                  />
                  {errors.height && <Text className="mt-1 text-default-3 text-error">{errors.height}</Text>}
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-default-2 text-muted">Cintura*</Text>
                  <DefaultTextInput 
                    placeholder="Ex: 50" 
                    value={waist} 
                    onChangeText={(text) => setWaist(text.replace(/,/g, "."))} 
                    onBlur={handleWaistBlur}
                    onFocus={handleWaistFocus}
                    keyboardType="decimal-pad"
                    className="h-11 rounded-[15px]"
                    outLineBorderClass={errors.waist ? "border-error" : "border-outline"}
                  />
                  {errors.waist && <Text className="mt-1 text-default-3 text-error">{errors.waist}</Text>}
                </View>
              </View>

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Nível de suporte*</Text>
                <Pressable
                  ref={supportLevelRef}
                  onPress={openSupportLevelDropdown}
                  className={`h-11 bg-level2 border rounded-[15px] px-4 flex-row items-center justify-between ${errors.supportLevel ? "border-error" : "border-outline"}`}
                >
                  <Text className={`text-default-1 ${supportLevel ? "text-white" : "text-muted"}`}>
                    {supportLevel || "Selecione aqui"}
                  </Text>
                  <ChevronDown color={colors.muted} size={20} />
                </Pressable>
                {errors.supportLevel && <Text className="mt-1 text-default-3 text-error">{errors.supportLevel}</Text>}
              </View>

              <DropdownModal 
                visible={dropdownVisible} 
                onClose={() => setDropdownVisible(false)} 
                onSelect={(val) => {
                  setSupportLevel(val);
                  if (errors.supportLevel) setErrors((prev) => ({ ...prev, supportLevel: "" }));
                }} 
                options={supportLevelOptions} 
                selectedValue={supportLevel} 
                layout={supportLevelLayout} 
              />

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Outras condições de saúde</Text>
                <DefaultTextInput
                  placeholder="Outras condições de saúde (opcional)"
                  className="h-20 rounded-[15px]"
                  multiline
                  maxLength={100}
                  value={healthConditions}
                  onChangeText={setHealthConditions}
                  textAlignVertical="top"
                />
                <Text className="text-muted text-default-3 text-right">{healthConditions.length}/100</Text>
              </View>

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">Observações</Text>
                <DefaultTextInput
                  placeholder="Observações adicionais (opcionais)"
                  className="h-11 rounded-[15px]"
                  maxLength={100}
                  value={observations}
                  onChangeText={setObservations}
                />
              </View>

              <ActionButtons 
                onCancel={onClose} 
                onSave={handleSaveWrapper} 
                cancelLabel="Cancelar" 
                saveLabel="Salvar" 
                className="mt-2" 
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={deletePhotoModalVisible}
        onClose={() => setDeletePhotoModalVisible(false)}
        onConfirm={() => {
          setPhotoUri(null);
          setDeletePhotoModalVisible(false);
        }}
        title="Remover foto?"
        mode="delete"
      />
    </>
  );
}