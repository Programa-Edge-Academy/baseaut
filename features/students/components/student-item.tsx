import { colors } from "@/assets/colors";
import { Trash2, User } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface StudentItemProps {
  name: string;
  age: number;
  weight: number;
  height: number;
  supportLevel: string;
  onRemove?: () => void;
}

export function StudentItem({ name, age, weight, height, supportLevel, onRemove }: StudentItemProps) {
  return (
    <View className="mb-4 w-full flex-row items-center justify-between rounded-2xl bg-level2 p-4 shadow-lg">
      <View className="flex-1 flex-row items-center gap-4">
        {/* Avatar */}
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-extra/10">
          <User size={28} color={colors.extra} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white" numberOfLines={1}>{name}</Text>
          <Text className="mt-1 text-sm font-medium text-placeholder">
            {age} anos • {weight}kg • {height}cm
          </Text>
          <View className="mt-1 self-start rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="text-xs font-bold text-primary">{supportLevel}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onRemove}
        className="ml-2 h-10 w-10 items-center justify-center active:opacity-60"
      >
        <Trash2 size={24} color={colors.placeholder} />
      </Pressable>
    </View>
  );
}
