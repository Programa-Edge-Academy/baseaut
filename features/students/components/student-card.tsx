import { Plus, Users } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { StudentItem } from "./student-item";

export function StudentCard({ className }: { className?: string }) {
  return (
    <View
      className={`w-full max-w-[380px] rounded-[20px] bg-[#181C25] p-5 shadow-lg ${className ?? ""}`}
    >
      {/* Header com Título e Botão Adicionar */}
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Users size={24} color="#FFB800" />
          <Text className="text-lg font-bold text-white">Alunos (4)</Text>
        </View>

        <Pressable className="flex-row items-center gap-1 rounded-full bg-[#1F2531] py-1 px-3 active:opacity-70">
          <Plus size={16} color="#0e89e5" />
          <Text className="text-sm font-bold text-[#0E89E5]">Adicionar</Text>
        </Pressable>
      </View>

      {/* Lista de Alunos */}
      <View>
        <StudentItem name="Lucas" code="acc1lucas" />
        <StudentItem name="Miguel" code="acc3miguel" />
        <StudentItem name="Beatriz" code="acc4beatriz" />
      </View>
    </View>
  );
}
