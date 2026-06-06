import { colors } from "@/assets/colors";
import { Check, User, UserMinus, X } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Props for a single companion row.
 */
interface CompanionItemProps {
  name: string;
  email: string;
  status?: "ativo" | "pendente" | "removido";
  onRemove?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

/**
 * Renders a companion row with status actions.
 */
export function CompanionItem({
  name,
  email,
  status = "ativo",
  onRemove,
  onAccept,
  onReject,
}: CompanionItemProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between last:mb-0">
      <View className="flex-1 min-w-0 flex-row items-center gap-4">
  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10">
    <User size={20} color={colors.secondary} />
  </View>

  <View className="flex-1 pr-2">
    <Text className="text-header-3 text-white" numberOfLines={1}>
      {name}
    </Text>
    <Text className="text-default-2 text-muted" numberOfLines={1}>
      {email}
    </Text>
  </View>
</View>

      {status === "pendente" ? (
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={onReject}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-error bg-error/10 active:opacity-60"
          >
            <X size={20} color={colors.error} />
          </Pressable>

          <Pressable
            onPress={onAccept}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-primaryShadow active:opacity-60"
          >
            <Check size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onRemove}
          className="h-10 w-10 items-center justify-center active:opacity-60"
        >
          <UserMinus size={24} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}
