import { colors } from "@/assets/colors";
import { Copy, Edit2, Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type CardMenuProps = {
  showDuplicate?: boolean;
  onEdit: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
};

export function CardMenu({
  showDuplicate = false,
  onEdit,
  onDuplicate,
  onDelete,
}: CardMenuProps) {
  return (
    <View className="absolute right-0 top-8 z-50 w-[140px] rounded-2xl border border-outline bg-level2 p-4 shadow-panelShadow">
      <View className="gap-5">
        <Pressable 
          onPress={onEdit} 
          className="flex-row items-center justify-between active:opacity-70"
        >
          <Text className="text-sm font-medium text-white">Editar</Text>
          <Edit2 size={16} color="#FFFFFF" />
        </Pressable>

        {showDuplicate && (
          <Pressable 
            onPress={onDuplicate} 
            className="flex-row items-center justify-between active:opacity-70"
          >
            <Text className="text-sm font-medium text-white">Duplicar</Text>
            <Copy size={16} color="#FFFFFF" />
          </Pressable>
        )}

        <Pressable 
          onPress={onDelete} 
          className="flex-row items-center justify-between active:opacity-70"
        >
          <Text className="text-sm font-medium text-error">Excluir</Text>
          <Trash2 size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}