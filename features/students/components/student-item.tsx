import { colors } from "@/assets/colors";
import { Trash2, User } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface StudentItemProps {
  name: string;
  code: string;
  onRemove?: () => void;
}

export function StudentItem({ name, code, onRemove }: StudentItemProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center gap-4">
        {/* Avatar com fundo escuro/alaranjado conforme imagem */}
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-extra/10">
          <User size={28} color={colors.extra} />
        </View>
        <View>
          <Text className="text-lg font-bold text-white">{name}</Text>
          <Text className="text-sm font-medium text-placeholder">
            Código: {code}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onRemove}
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <Trash2 size={24} color={colors.placeholder} />
      </Pressable>
    </View>
  );
}
