import { AppModal } from "@/components/app-modal";
import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { SpotlightBinding } from "@/features/tutorial/components/spotlight-binding";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { Copy, Edit2, Trash2 } from "lucide-react-native";
import React, { useRef } from "react";
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
  /** Label for the edit action. Defaults to the translated "Edit". */
  editLabel?: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  /** Tutorial spotlight key for the edit item. */
  editSpotlightKey?: string;
  /** Tutorial spotlight key for the duplicate item. */
  duplicateSpotlightKey?: string;
  /** Tutorial spotlight key for the delete item. */
  deleteSpotlightKey?: string;
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
  editLabel,
  onEdit,
  onDuplicate,
  onDelete,
  editSpotlightKey,
  duplicateSpotlightKey,
  deleteSpotlightKey,
}: CardMenuProps) {
  const { t } = useI18n();
  const editItemRef = useRef<View>(null);
  const duplicateItemRef = useRef<View>(null);
  const deleteItemRef = useRef<View>(null);
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
        {/* Bound from inside the modal so the tap guard treats these as its own. */}
        <SpotlightBinding targetKey={editSpotlightKey} viewRef={editItemRef} />
        <SpotlightBinding
          targetKey={duplicateSpotlightKey}
          viewRef={duplicateItemRef}
        />
        <SpotlightBinding targetKey={deleteSpotlightKey} viewRef={deleteItemRef} />

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
                ref={editItemRef}
                onPress={() => { onClose(); onEdit(); }}
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-content">{editLabel ?? t("common.edit")}</Text>
                <Edit2 size={16} color="#FFFFFF" />
              </Pressable>
            )}

            {showDuplicate && (
              <Pressable
                ref={duplicateItemRef}
                onPress={() => { onClose(); onDuplicate?.(); }}
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-content">{t("common.duplicate")}</Text>
                <Copy size={16} color="#FFFFFF" />
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                ref={deleteItemRef}
                onPress={() => { onClose(); onDelete(); }}
                className="flex-row items-center justify-between active:opacity-70"
              >
                <Text className="text-sm font-medium text-error">{t("common.delete")}</Text>
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            )}
          </View>
        </Pressable>

        <TutorialSpotlight />
      </Pressable>
    </AppModal>
  );
}