import { colors } from "@/assets/colors";
import { Calendar, ChevronDown, ImageUp, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ActionButtons } from "../../../components/action-buttons";
import { DefaultTextInput } from "../../../components/default-text-input";
import { DropdownModal } from "../../../components/dropdown-modal";

export type NewStudentProps = {
  visible?: boolean;
  borderRadius?: number;
  onClose: () => void;
  handlePhotoPress: () => void;
  onSave: () => void;
};

export function NewStudent({
  visible,
  onClose,
  borderRadius = 15,
  handlePhotoPress,
  onSave,
}: NewStudentProps) {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [supportLevel, setSupportLevel] = useState<string | null>(null);
  const [healthConditions, setHealthConditions] = useState("");
  const [observations, setObservations] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const supportLevelRef = useRef<View>(null);
  const [supportLevelLayout, setSupportLevelLayout] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const supportLevelOptions = [
    "Nível 1 - Apoio Mínimo",
    "Nível 2 - Apoio Moderado",
    "Nível 3 - Apoio Substancial",
  ];

  const openSupportLevelDropdown = () => {
    supportLevelRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSupportLevelLayout({ top: pageY + height, left: pageX, width });
      setDropdownVisible(true);
    });
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
          style={{
            borderRadius,
          }}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <View className="p-[25px] gap-[20px]">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-white">Novo aluno</Text>
              <Pressable onPress={onClose}>
                <X color={colors.muted} size={30} />
              </Pressable>
            </View>

            {/* Photo Icon */}
            <View className="items-center">
              <Pressable
                onPress={handlePhotoPress}
                className="w-[100px] h-[100px] bg-outline items-center justify-center rounded-[15px]"
              >
                <ImageUp color={colors.muted} size={50} />
              </Pressable>
            </View>

            {/* Full Name Input */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">Nome completo*</Text>
              <DefaultTextInput
                placeholder="Nome do aluno"
                className="h-[44px]"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Birth Date Input */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">
                Data de nascimento*
              </Text>
              <View className="relative">
                <DefaultTextInput
                  placeholder="Data de nascimento do aluno"
                  className="h-[44px] pr-[50px]"
                  value={birthDate}
                  onChangeText={setBirthDate}
                />
                <View className="absolute right-[15px] top-[12px]">
                  <Calendar color={colors.muted} size={20} />
                </View>
              </View>
            </View>

            {/* Weight and Height Inputs */}
            <View className="flex-row gap-[10px]">
              <View className="flex-1 gap-2">
                <Text className="text-muted text-default-1">Peso</Text>
                <DefaultTextInput
                  placeholder="Peso (Kg)"
                  className="h-[44px]"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1 gap-2">
                <Text className="text-muted text-default-1">Altura</Text>
                <DefaultTextInput
                  placeholder="Altura (Cm)"
                  className="h-[44px]"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Support Level Dropdown */}
            <View className="gap-2">
              <Text className="text-muted text-default-1">
                Nível de suporte
              </Text>
              <Pressable
                ref={supportLevelRef} 
                collapsable={false} 
                onPress={openSupportLevelDropdown}
                className="h-[44px] bg-level2 border border-outline rounded-[10px] px-[12px] flex-row items-center justify-between"
              >
                <Text
                  className={`text-default-1 ${
                    supportLevel ? "text-white" : "text-muted"
                  }`}
                >
                  {supportLevel || "Selecione aqui"}
                </Text>
                <ChevronDown color={colors.muted} size={20} />
              </Pressable>
            </View>

            <DropdownModal
              visible={dropdownVisible}
              onClose={() => setDropdownVisible(false)}
              onSelect={(option) => setSupportLevel(option)}
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
                value={observations}
                onChangeText={setObservations}
              />
            </View>

            {/* Action Buttons */}
            <ActionButtons
              onCancel={onClose}
              onSave={onSave}
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
