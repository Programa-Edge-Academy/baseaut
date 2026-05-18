import React from "react";
import { Split } from "lucide-react-native";
import { View, Text, ScrollView, Pressable } from "react-native";
import { ExerciseRow } from "./exercise-row";
import { colors } from "@/assets/colors";

// Informações puxadas para cada exercício
interface ExerciseData {
  id: string;
  name: string;
  description: string;
}

interface ExerciseSelectionModalProps {
exercises: ExerciseData[];
  onSelectExercise: (id: string) => void;
  onPressEngagement?: () => void;
  className?: string;
}



export function ExerciseSelectionModal({
  exercises,
  onSelectExercise,
  onPressEngagement,
  className = "",
}:ExerciseSelectionModalProps) {
  return (
    <View 
      className={`w-full max-w-md rounded-[24px] bg-level1 p-6 border border-outline ${className}`}
      style={{ backgroundColor: colors.level1 }}
    >
      {/* Cabeçalho do Modal */}
      <View className="flex-row items-start justify-between mb-6">
        <View className="flex-1 pr-4">
          <Text className="text-[18px] font-bold text-white leading-7">
            Selecione o próximo exercício
          </Text>
          <Text className="mt-1 text-[14px]  text-muted leading-5">
            Para atividades de engajamento, pressione o botão amarelo ao lado
          </Text>
        </View>

        {/* Botão Amarelo de Engajamento */}
        <Pressable
          onPress={onPressEngagement}
          className="h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 active:opacity-70"
          style={{ backgroundColor: colors.extra + "25" }}
        >
          <Split 
            size={20} 
            color={colors.extra}
          />
        </Pressable>
      </View>

      {/* Lista de Exercícios Utilizando o Subcomponente */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="space-y-3" 
        contentContainerStyle={{ gap: 12 }}
      >
        {exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            name={exercise.name}
            description={exercise.description}
            onPress={() => onSelectExercise(exercise.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}