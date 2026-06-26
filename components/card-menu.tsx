import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { Copy, Edit2, Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

/** Props for {@link CardMenu}. */
export type CardMenuProps = {
  /** Whether the menu is visible. */
  visible: boolean;
  /** Called when the menu requests to close. */
  onClose: () => void;
  /** Anchor position used to align the menu's right edge to the trigger button. */
  layout: { top: number; left: number; width: number };
  /** Whether to show the duplicate action. Defaults to false. */
  showDuplicate?: boolean;
  /** Label for the edit action. Defaults to "Editar". */
  editLabel?: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

/**
 * Contextual popover menu anchored to a card, exposing edit, duplicate, and
 * delete actions. Its right edge is aligned with the trigger button.
 */
export function CardMenu({
  visible,
  onClose,
  layout,
  showDuplicate = false,
  editLabel = "Editar",
  onEdit,
  onDuplicate,
  onDelete,
}: CardMenuProps) {
  const menuWidth = 140;
  const left = layout.left + layout.width - menuWidth;

  return (
    <AppModal
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
            {onEdit && (
              <Pressable 
                onPress={() => { onClose(); onEdit(); }} 
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-white">{editLabel}</Text>
                <Edit2 size={16} color="#FFFFFF" />
              </Pressable>
            )}

            {showDuplicate && (
              <Pressable 
                onPress={() => { onClose(); onDuplicate?.(); }} 
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-white">Duplicar</Text>
                <Copy size={16} color="#FFFFFF" />
              </Pressable>
            )}

            {onDelete && (
              <Pressable 
                onPress={() => { onClose(); onDelete(); }} 
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-error">Excluir</Text>
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}