import { colors } from "@/assets/colors";
import { Trash2, User } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export interface StudentItemProps {
  name: string;
  onRemove?: () => void;
  onEdit?: () => void;
}

export function StudentItemTeam({ name, onRemove, onEdit }: StudentItemProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between last:mb-0">
      
      <Pressable 
        onPress={onEdit} 
        className="flex-1 flex-row items-center gap-4 active:opacity-70"
      >
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-extra/10">
          <User size={20} color={colors.extra} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-header-3 text-white" numberOfLines={1}>
            {name}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onRemove}
        className="ml-2 h-10 w-10 items-center justify-center active:opacity-60"
      >
        <Trash2 size={24} color={colors.muted} />
      </Pressable>
    </View>
  );
}