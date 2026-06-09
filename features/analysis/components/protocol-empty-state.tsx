import { colors } from "@/assets/colors";
import { ClipboardList } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export type ProtocolEmptyStateProps = {
  title?: string;
  description?: string;
};

/** Shared empty state used when a student has no record for a protocol. */
export function ProtocolEmptyState({
  title = "Ainda não há registro deste protocolo para este aluno.",
  description = "Quando houver um registro, os dados ficarão disponíveis para visualização nesta tela.",
}: ProtocolEmptyStateProps) {
  return (
    <View className="mx-8 mt-8 items-center justify-center rounded-2xl border border-outline bg-level1 px-6 py-16">
      <ClipboardList size={56} color={colors.muted} strokeWidth={1.5} />
      <Text className="mt-6 text-center text-default-2 font-medium text-white">
        {title}
      </Text>
      <Text className="mt-2 text-center text-sm text-muted">{description}</Text>
    </View>
  );
}
