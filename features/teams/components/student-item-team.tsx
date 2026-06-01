import { colors } from "@/assets/colors";
import { Trash2, User } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View, Image } from "react-native";

/**
 * Props for a team student row.
 */
export interface StudentItemProps {
  name: string;
  avatarUrl?: string | null;
  onRemove?: () => void;
  onEdit?: () => void;
}

/**
 * Renders a student row inside the team card.
 */
export function StudentItemTeam({ name, avatarUrl, onRemove, onEdit }: StudentItemProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between last:mb-0">
      <Pressable
        onPress={onEdit}
        className="flex-1 flex-row items-center gap-4 active:opacity-70"
      >
        <View 
          className={`h-11 w-11 items-center justify-center rounded-2xl ${avatarUrl ? "bg-transparent" : "bg-extra/10"}`}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <User size={20} color={colors.extra} />
          )}
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