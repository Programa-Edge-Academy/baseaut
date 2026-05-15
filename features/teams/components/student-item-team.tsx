import { colors } from "@/assets/colors";
import { Trash2, User } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export interface StudentItemProps {
  name: string;
  onRemove?: () => void;
}

export function StudentItem({ name, onRemove }: StudentItemProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between last:mb-0">
      <View className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-extra/10">
          <User size={28} color={colors.extra} />
        </View>
        <View>
          <Text className="text-lg font-bold text-white">{name}</Text>
        </View>
      </View>

      <Pressable
        onPress={onRemove}
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <Trash2 size={24} color={colors.muted} />
      </Pressable>
    </View>
  );
}