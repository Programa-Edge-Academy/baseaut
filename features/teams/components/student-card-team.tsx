import { Plus, Users } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { StudentItem } from "./student-item-team";
import { colors } from "@/assets/colors";

export type Student = {
  id: string;
  name: string;
};

interface StudentCardProps {
  className?: string;
  students: Student[];
  onAddPress?: () => void;
  onRemoveStudent?: (id: string) => void;
}

export function StudentCard({ className, students, onAddPress, onRemoveStudent }: StudentCardProps) {
  return (
    <View
      className={`w-full max-w-[380px] rounded-[20px] bg-level2 p-5 shadow-lg border border-outline ${className ?? ""}`}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Users size={24} color={colors.extra} />
          <Text className="text-lg font-bold text-white">Alunos ({students.length})</Text>
        </View>

        <Pressable 
          onPress={onAddPress}
          className="flex-row items-center gap-1 rounded-full bg-primary/10 px-3 py-1 active:opacity-70"
        >
          <Plus size={16} color={colors.primary} />
          <Text className="text-sm font-medium text-primary">Adicionar</Text>
        </Pressable>
      </View>

      {/* Renderização do Estado Vazio vs Lista */}
      {students.length === 0 ? (
        <Text className="text-sm font-medium text-muted leading-5">
          Nenhum aluno na equipe. Cadastre novos alunos.
        </Text>
      ) : (
        <View>
          {students.map((student) => (
            <StudentItem 
              key={student.id} 
              name={student.name} 
              onRemove={() => onRemoveStudent?.(student.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}