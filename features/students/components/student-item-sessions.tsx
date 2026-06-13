import { colors } from "@/assets/colors";
import { RipplePressable } from "@/components/ripple-pressable";
import { AlertCircle, User } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/**
 * Props for a student list item with sessions history.
 */
interface StudentItemSessionsProps {
  name: string;
  sessions: number;
  onClick: () => void;
  pendencyAlert?: boolean;
}

/**
 * Renders a clickable student row with an overlaid pendency alert on the avatar.
 */
export function StudentItemSessions({
  name,
  sessions,
  onClick,
  pendencyAlert = false,
}: StudentItemSessionsProps) {
  
  return (
    <RipplePressable
      onPress={onClick}
      className="mb-4 h-20 w-full flex-row items-center justify-between rounded-2xl border border-outline bg-level2 px-3.5 active:opacity-70"
    >
      {/* Bloco da Esquerda: Conteúdo Principal */}
      <View className="flex-1 flex-row items-center gap-3.5 pr-2">
        
        {/* Container do Avatar (com relative para permitir a sobreposição absoluta) */}
        <View className="relative h-11 w-11">
          {/* O Quadrado do Avatar */}
          <View className="h-full w-full items-center justify-center rounded-2xl bg-level1">
            <User size={20} color={colors.muted} />
          </View>

          {/* O Alerta Vermelho sobreposto no canto superior direito */}
          {pendencyAlert && (
            <View className="absolute -right-1 -top-1 rounded-full bg-level2 p-0.5">
              <AlertCircle size={16} color={colors.extra} />
            </View>
          )}
        </View>

        {/* Textos Informativos */}
        <View className="flex-1 justify-center gap-0.5">
          <Text className="text-base font-medium text-white" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-sm font-medium text-muted" numberOfLines={1}>
            {sessions} {sessions === 1 ? "sessão" : "sessões"}
          </Text>
        </View>
      </View>

    </RipplePressable>
  );
}