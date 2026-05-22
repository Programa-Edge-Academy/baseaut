import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { GripVertical, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export type ReorderItem = {
  id: string;
  name: string;
};

export type ReorderModalProps = {
  visible: boolean;
  items: ReorderItem[];
  onClose: () => void;
  onConfirm: (items: ReorderItem[]) => void;
  title?: string;
  description?: string;
};

/**
 * Modal listing items that the user can reorder. The visual scaffolding
 * (numbering, grip handles) is in place; a future iteration can plug in a
 * drag-and-drop library to mutate `draft` while the user moves rows.
 */
export function ReorderModal({
  visible,
  items,
  onClose,
  onConfirm,
  title = "Mudar ordem",
  description = "Arraste para reordenar os exercícios restantes.",
}: ReorderModalProps) {
  const { width, height } = useWindowDimensions();
  const [draft, setDraft] = useState<ReorderItem[]>(items);

  useEffect(() => {
    if (visible) setDraft(items);
  }, [visible, items]);

  // TODO: wire to a drag-and-drop library (e.g. react-native-draggable-flatlist)
  // to reorder `draft` while the user moves a row.

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/50"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-level2 border border-outline rounded-2xl"
          style={{
            width: width * 0.92,
            maxWidth: 420,
            maxHeight: height * 0.8,
          }}
        >
          <View className="gap-4 p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-white">{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X color={colors.muted} size={24} />
              </Pressable>
            </View>

            <Text className="text-default-2 text-muted leading-5">
              {description}
            </Text>

            <ScrollView style={{ maxHeight: height * 0.45 }}>
              <View className="gap-2">
                {draft.map((item, index) => (
                  <View
                    key={item.id}
                    className="flex-row items-center rounded-2xl border border-outline bg-level1 p-3"
                  >
                    <GripVertical size={18} color={colors.muted} />
                    <Text className="ml-2 text-default-1 text-white">
                      {index + 1}. {item.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <ActionButtons
              onCancel={onClose}
              onSave={() => onConfirm(draft)}
              cancelLabel="Cancelar"
              saveLabel="Confirmar"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
