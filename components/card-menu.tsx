import { colors } from "@/assets/colors";
import { Copy, Edit2, Trash2 } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

export type CardMenuProps = {
  visible: boolean;
  onClose: () => void;
  layout: { top: number; left: number; width: number };
  showDuplicate?: boolean;
  onEdit: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
};

export function CardMenu({
  visible,
  onClose,
  layout,
  showDuplicate = false,
  onEdit,
  onDuplicate,
  onDelete,
}: CardMenuProps) {
  // We want the menu to align its right edge with the button's right edge
  // The menu width is 140. So left = layout.left + layout.width - 140
  const menuWidth = 140;
  const left = layout.left + layout.width - menuWidth;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1" onPress={onClose}>
        <Pressable
          style={{
            position: "absolute",
            top: layout.top,
            left: left,
            width: menuWidth,
          }}
          className="z-50 rounded-2xl border border-outline bg-level2 p-4 shadow-panelShadow"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="gap-5">
            <Pressable 
              onPress={() => { onClose(); onEdit(); }} 
              className="flex-row items-center justify-between active:opacity-70"
            >
              <Text className="text-sm font-medium text-white">Editar</Text>
              <Edit2 size={16} color="#FFFFFF" />
            </Pressable>

            {showDuplicate && (
              <Pressable 
                onPress={() => { onClose(); onDuplicate?.(); }} 
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-white">Duplicar</Text>
                <Copy size={16} color="#FFFFFF" />
              </Pressable>
            )}

            <Pressable 
              onPress={() => { onClose(); onDelete(); }} 
              className="flex-row items-center justify-between active:opacity-70"
            >
              <Text className="text-sm font-medium text-error">Excluir</Text>
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}