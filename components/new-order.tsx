import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { DraggableList, DraggableItem } from "@/components/draggable-list";
import { X } from "lucide-react-native";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

export type OrderItem = DraggableItem;

export type NewOrderProps = {
  borderRadius?: number;
  visible?: boolean;
  onClose: () => void;
  onConfirm: (items: OrderItem[]) => void;
  items: OrderItem[];
};

export function NewOrder({
  borderRadius = 15,
  visible = true,
  onClose,
  onConfirm,
  items,
}: NewOrderProps) {
  const { width, height } = useWindowDimensions();
  return (
    <AppModal visible={visible} onRequestClose={onClose} transparent animationType="fade">
      <View className="flex-1 bg-black/50">
        <View
          className="border bg-level2 border-outline"
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
                <X color={colors.muted} size={30} />
              </Pressable>
            </View>
            <Text className="text-muted text-default-1">
              Segure e arraste pelo ícone de alça para reordenar os exercícios.
            </Text>
            <DraggableList items={items} onReorder={onConfirm} />
            <ActionButtons onCancel={onClose} onSave={() => onConfirm(items)} />
          </View>
        </View>
      </View>
    </AppModal>
  );
}
