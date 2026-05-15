import { colors } from "@/assets/colors";
import { Check, User, UserMinus, X } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface CompanionItemProps {
  name: string;
  email: string;
  status?: "active" | "pending"; // Novo estado
  onRemove?: () => void;
  onAccept?: () => void; // Ação de aceitar
  onReject?: () => void; // Ação de recusar
}

export function CompanionItem({ 
  name, 
  email, 
  status = "active", 
  onRemove, 
  onAccept, 
  onReject 
}: CompanionItemProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between last:mb-0">
      <View className="flex-row items-center gap-4">
        {/* Usando size-11 (h-11 w-11) conforme o seu Figma */}
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10">
          <User size={20} color={colors.secondary} />
        </View>
        <View>
          <Text className="text-base font-bold text-white">{name}</Text>
          <Text className="text-sm font-medium text-muted">{email}</Text>
        </View>
      </View>

      {/* Renderização Condicional Baseada no Status */}
      {status === "pending" ? (
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