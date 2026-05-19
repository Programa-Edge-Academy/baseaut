import { colors } from "@/assets/colors";
import { Plus, Users } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { StudentItemTeam } from "./student-item-team";

/**
 * Minimal student shape used in the team card.
 */
export type Student = {
  id: string;
  name: string;
  [key: string]: any;
};

/**
 * Props for the student list card in team management.
 */
interface StudentCardProps {
  className?: string;
  students: Student[];
  onAddPress?: () => void;
  onRemoveStudent?: (id: string) => void;
  onEditStudent?: (id: string) => void;
}

/**
 * Renders a card listing team students with actions.
 */
export function StudentCardTeam({
  className,
  students,
  onAddPress,
  onRemoveStudent,
  onEditStudent,
}: StudentCardProps) {
  return (
    <View
      className={`w-full max-w-[380px] rounded-[20px] bg-level2 p-5 border border-outline ${className ?? ""}`}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Users size={24} color={colors.extra} />
          <Text className="text-lg font-bold text-white">
            Alunos ({students.length})
          </Text>
        </View>

        <Pressable
          onPress={onAddPress}
          className="flex-row items-center gap-1 rounded-full bg-primary/10 px-3 py-1 active:opacity-70"
        >
          <Plus size={16} color={colors.primary} />
          <Text className="text-sm font-medium text-primary">Adicionar</Text>
        </Pressable>
      </View>

      {students.length === 0 ? (
        <Text className="text-sm font-medium text-muted leading-5">
          Nenhum aluno na equipe. Cadastre novos alunos.
        </Text>
      ) : (
        <View>
          {students.map((student) => (
            <StudentItemTeam
              key={student.id}
              name={student.name}
              onEdit={() => onEditStudent?.(student.id)}
              onRemove={() => onRemoveStudent?.(student.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
