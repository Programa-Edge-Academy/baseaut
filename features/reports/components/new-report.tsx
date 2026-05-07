import { Calendar, Check, X } from "lucide-react-native";
import {
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";

type CheckboxItemProps = {
  label: string;
  checked?: boolean;
  onChange?: (value: boolean) => void;
};

function CheckboxItem({ label, checked = false, onChange }: CheckboxItemProps) {
  return (
    <Pressable
      onPress={() => onChange?.(!checked)}
      className="flex-row items-center gap-3 py-1"
    >
      <View
        className={`w-5 h-5 rounded items-center justify-center ${
          checked ? "bg-[#0E89E5]" : "bg-transparent border border-[#66758A]"
        }`}
      >
        {checked && <Check color="white" size={14} />}
      </View>
      <Text className="text-white text-default-1">{label}</Text>
    </Pressable>
  );
}

export type ReportField = {
  id: string;
  label: string;
  checked: boolean;
};

export type NewReportProps = {
  borderRadius?: number;
  onClose: () => void;
  fields: ReportField[];
  onFieldChange: (id: string, value: boolean) => void;
};

export function NewReport({
  borderRadius = 15,
  onClose,
  fields,
  onFieldChange,
}: NewReportProps) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible onRequestClose={onClose} transparent animationType="fade">
      <View className="flex-1 bg-black/50">
        <View
          className="border bg-[#1B1F27] border-[#2B303B]"
          style={{
            borderRadius,
            marginHorizontal: width * 0.02,
            marginVertical: height * 0.11,
          }}
        >
          <View className="p-[25px] gap-[25px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-white">Novo Relatório</Text>
              <Pressable onPress={onClose}>
                <X color="#66758A" size={30} />
              </Pressable>
            </View>
            <View className="flex-row items-center gap-[22px]">
              <DefaultTextInput
                placeholder="Nome do relatório"
                className="flex-1"
              />
              <Calendar color="#66758A" />
            </View>
            <View className="gap-[2px]">
              <Text className="text-[#66758A] text-default-1">Observação</Text>
              <DefaultTextInput
                placeholder="Observações e insights"
                className="h-[80px]"
              />
            </View>
            <View className="gap-[2px]">
              <Text className="text-[#66758A] text-default-1">
                Campos exibidos no relatório
              </Text>
              <View className="gap-1">
                {fields.map((field) => (
                  <CheckboxItem
                    key={field.id}
                    label={field.label}
                    checked={field.checked}
                    onChange={(value) => onFieldChange(field.id, value)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
