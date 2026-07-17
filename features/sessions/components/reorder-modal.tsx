import { AppModal } from "@/components/app-modal";
import { DraggableList, DraggableItem } from "@/components/draggable-list";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/assets/colors";
import { SessionExercise } from "../screens/session-running-screen";

/** Props for {@link ReorderModal}. */
interface ReorderModalProps {
  visible: boolean;
  items: SessionExercise[];
  currentIndex: number;
  onClose: () => void;
  onReorder: (items: SessionExercise[]) => void;
  /** Tutorial spotlight key for the drag-and-drop area. */
  reorderSpotlightKey?: string;
}

/**
 * Bottom-sheet modal that lets the user reorder the remaining session exercises
 * via a drag-and-drop list.
 *
 * @remarks
 * The sheet's bottom padding includes the safe-area inset so the confirm button
 * is never covered by the device's system navigation bar.
 *
 * It renders its own {@link TutorialSpotlight} so a sub-step targeting the
 * drag area is highlighted over the sheet instead of behind it.
 */
export function ReorderModal({
  visible,
  items,
  currentIndex,
  onClose,
  onReorder,
  reorderSpotlightKey,
}: ReorderModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const insets = useSafeAreaInsets();
  const sim = useTutorialSimulation();
  const reorderRef = useRef<View>(null);

  useEffect(() => {
    if (!reorderSpotlightKey) return;
    sim.registerTarget(reorderSpotlightKey, reorderRef, { rounded: true });
    return () => sim.unregisterTarget(reorderSpotlightKey);
  }, [sim, reorderSpotlightKey]);

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
        <View
          className="bg-level2 rounded-t-[32px] p-6 h-[80%] border-t border-outline"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-content text-[24px] font-bold">Mudar ordem</Text>
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
            <View ref={reorderRef} collapsable={false}>
              <DraggableList
                items={draggableItems}
                onReorder={handleReorder}
                onDragActiveChange={setIsDragging}
              />
            </View>
          </ScrollView>

          <Pressable
            onPress={onClose}
            className="mt-6 w-full py-4 bg-level1 border border-outline rounded-2xl items-center"
          >
            <Text className="text-content font-bold">Concluir reordenagem</Text>
          </Pressable>

          <TutorialSpotlight />
        </View>
      </View>
    </AppModal>
  );
}
