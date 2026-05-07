import { User, UserMinus } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface CompanionItemProps {
  name: string;
  email: string;
  onRemove?: () => void;
}

export function CompanionItem({ name, email, onRemove }: CompanionItemProps) {
  return (
    <View className="flex-row items-center justify-between mb-4 last:mb-0">
      <View className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#1F2531]">
          <User size={28} color="#1DB954" />
        </View>
        <View>
          <Text className="text-lg font-bold text-white">{name}</Text>
          <Text className="text-sm font-medium text-[#465460]">{email}</Text>
        </View>
      </View>
      <Pressable
        onPress={onRemove}
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <UserMinus size={24} color="#465460" />
      </Pressable>
    </View>
  );
}
