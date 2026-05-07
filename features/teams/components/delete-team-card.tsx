import React from "react";
import { View, Text, Pressable } from "react-native";
import { Trash2 } from "lucide-react-native";

interface DeleteTeamCardProps {
  onDelete?: () => void;
  className?: string;
}

export function DeleteTeamCard({ onDelete, className }: DeleteTeamCardProps) {
  return (
    <Pressable 
      onPress={onDelete}
      className={`w-full max-w-[380px] flex-row items-center rounded-[20px] bg-[#181C25] p-5 border border-transparent active:border-red-900/50 ${className ?? ""}`}
    >
      {/* Ícone de Lixeira com fundo avermelhado suave */}
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2A1818]">
        <Trash2 size={28} color="#E53E3E" />
      </View>

      {/* Textos Informativos */}
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-[#E53E3E]">
          Excluir equipe
        </Text>
        <Text className="text-sm font-medium text-[#465460] leading-5">
          Apagar permanentemente esta equipe e todos os dados
        </Text>
      </View>
    </Pressable>
  );
}