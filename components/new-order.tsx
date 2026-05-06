import { GripVertical, X } from "lucide-react-native";
import {
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export type OrderItem = {
  id: string;
  name: string;
};

export type NewOrderProps = {
  borderRadius?: number;
  onClose: () => void;
  onConfirm: () => void;
  items: OrderItem[];
};

export function NewOrder({
  borderRadius = 15,
  onClose,
  onConfirm,
  items,
}: NewOrderProps) {
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
              <Text className="text-header-2 text-white">Mudar ordem</Text>
              <Pressable onPress={onClose}>
                <X color="#66758A" size={30} />
              </Pressable>
            </View>
            <Text className="text-[#66758A] text-default-1">
              Arraste para reordenar os exercícios restantes.
            </Text>
            <View className="gap-3">
              {items.map((item, index) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 border border-[#2B303B] rounded-[10px] px-3 py-3"
                >
                  <GripVertical color="#66758A" size={20} />
                  <Text className="text-white text-default-1">
                    {index + 1}. {item.name}
                  </Text>
                </View>
              ))}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 border border-[#2B303B] rounded-full py-3 items-center justify-center"
              >
                <Text className="text-[#66758A] text-default-1">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                className="flex-1 bg-[#0E89E5] rounded-full py-3 items-center justify-center"
              >
                <Text className="text-white font-medium">Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
