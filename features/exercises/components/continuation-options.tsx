import { RipplePressable } from "@/components/ripple-pressable";
import React from "react";
import { View, Text, Pressable } from "react-native";

interface ContinuationOptionsProps {
  onSelectOption: (id: string) => void;
  onCancel: () => void;
  className?: string;
}

// 1. Opções mockadas internamente conforme solicitado
const CONTINUATION_OPTIONS = [
  {
    id: "try_unrealized",
    title: "Tentar exercício não realizado",
    description: "1 exercício não realizado",
  },
  {
    id: "repeat_exercise",
    title: "Repetir exercício",
    description: "Escolher exercício do circuito para repetir",
  },
  {
    id: "do_other",
    title: "Realizar outro exercício",
    description: "Escolher qualquer exercício da equipe",
  },
];

// 2. Subcomponente local para os itens da lista
interface OptionItemProps {
  title: string;
  description: string;
  onPress: () => void;
}

function OptionItem({ title, description, onPress }: OptionItemProps) {
  return (
    <RipplePressable
    
      onPress={onPress}
      className="w-full rounded-[20px] bg-level1 p-5 border border-outline active:opacity-70"
    >
      <Text className="text-[18px] font-semibold text-white">
        {title}
      </Text>
      <Text className="mt-1 text-[14px] text-muted leading-5">
        {description}
      </Text>
    </RipplePressable>
  );
}

// 3. Componente Principal
export function ContinuationOptions({
  onSelectOption,
  onCancel,
  className = "",
}: ContinuationOptionsProps) {
  return (
    <View className={`w-full max-w-md p-4 ${className}`}>
      {/* Container das opções com espaçamento (gap) entre elas */}
      <View className="flex-col" style={{ gap: 12 }}>
        {CONTINUATION_OPTIONS.map((option) => (
          <OptionItem
            key={option.id}
            title={option.title}
            description={option.description}
            onPress={() => onSelectOption(option.id)}
          />
        ))}
      </View>

      {/* Botão de Cancelar centralizado ao fundo */}
      <Pressable
        onPress={onCancel}
        className="mt-5 w-full py-3 items-center justify-center active:opacity-60"
      >
        <Text className="text-[16px] font-medium text-muted">
          Cancelar
        </Text>
      </Pressable>
    </View>
  );
}