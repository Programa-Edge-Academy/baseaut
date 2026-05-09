import { Plus, Users } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { StudentItem } from "./student-item";
import { colors } from "@/assets/colors";

export function StudentCard({ className }: { className?: string }) {
  return (
    <View
      className={`w-full max-w-[380px] rounded-[20px] bg-level2 p-5 shadow-lg ${className ?? ""}`}
    >
      {/* Header com Título e Botão Adicionar */}
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Users size={24} color={colors.extra} />
          <Text className="text-lg font-bold text-white">Alunos (4)</Text>
        </View>

        <Pressable className="flex-row items-center gap-1 rounded-full bg-primary/10 py-1 px-3 active:opacity-70">
          <Plus size={16} color={colors.primary} />
          <Text className="text-sm font-bold text-primary">Adicionar</Text>
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
