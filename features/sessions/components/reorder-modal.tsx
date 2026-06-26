import { AppModal } from "@/components/app-modal";
import { DraggableList, DraggableItem } from "@/components/draggable-list";
import { X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors } from "@/assets/colors";
import { SessionExercise } from "../screens/session-running-screen";

/** Props for {@link ReorderModal}. */
interface ReorderModalProps {
  visible: boolean;
  items: SessionExercise[];
  currentIndex: number;
  onClose: () => void;
  onReorder: (items: SessionExercise[]) => void;
}

/**
 * Bottom-sheet modal that lets the user reorder the remaining session exercises
 * via a drag-and-drop list.
 */
export function ReorderModal({
  visible,
  items,
  currentIndex,
  onClose,
  onReorder,
}: ReorderModalProps) {
  const [isDragging, setIsDragging] = useState(false);

  const draggableItems: DraggableItem[] = items.map((ex) => ({
    id: ex.id,
    name: ex.name,
  }));

  const handleReorder = (sorted: DraggableItem[]) => {
    const reordered = sorted.map(
      (d) => items.find((ex) => ex.id === d.id)!,
    );
    onReorder(reordered);
  };

  return (
    <AppModal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-level2 rounded-t-[32px] p-6 h-[80%] border-t border-outline">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white text-[24px] font-bold">Mudar ordem</Text>
              <Text className="text-muted text-[14px]">
                Segure e arraste pelo ícone de alça para reordenar
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="bg-level1 p-2 rounded-full border border-outline"
            >
              <X size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isDragging}
          >
            <DraggableList
              items={draggableItems}
              onReorder={handleReorder}
              onDragActiveChange={setIsDragging}
            />
          </ScrollView>

          <Pressable
            onPress={onClose}
            className="mt-6 w-full py-4 bg-level1 border border-outline rounded-2xl items-center"
          >
            <Text className="text-white font-bold">Concluir reordenagem</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
}
