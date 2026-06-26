import { RipplePressable } from "@/components/ripple-pressable";
import React from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Props for the continuation options list.
 */
interface ContinuationOptionsProps {
  unrealizedCount: number;
  onSelectOption: (id: string) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Props for a single option item in the list.
 */
interface OptionItemProps {
  title: string;
  description: string;
  onPress: () => void;
}

/**
 * Renders a selectable continuation option.
 */
function OptionItem({ title, description, onPress }: OptionItemProps) {
  return (
    <RipplePressable
      onPress={onPress}
      className="w-full rounded-[20px] bg-level1 p-5 border border-outline active:opacity-70"
    >
      <Text className="text-[18px] font-semibold text-white">{title}</Text>
      <Text className="mt-1 text-[14px] text-muted leading-5">
        {description}
      </Text>
    </RipplePressable>
  );
}

/**
 * Renders the continuation options and a cancel action.
 */
export function ContinuationOptions({
  unrealizedCount,
  onSelectOption,
  onCancel,
  className = "",
}: ContinuationOptionsProps) {
  /**
   * Static list of continuation options shown to the user.
   */
  const CONTINUATION_OPTIONS: { id: string; title: string; description: string }[] = [];

  if (unrealizedCount > 0) {
    CONTINUATION_OPTIONS.push({
      id: "try_unrealized",
      title: "Tentar exercício não realizado",
      description: unrealizedCount === 1
        ? "1 exercício não realizado"
        : `${unrealizedCount} exercícios não realizados`,
    });
  }

  CONTINUATION_OPTIONS.push(
    {
      id: "repeat_exercise",
      title: "Repetir exercício",
      description: "Escolher exercício do circuito para repetir",
    },
    {
      id: "do_other",
      title: "Realizar outro exercício",
      description: "Escolher qualquer exercício da equipe",
    }
  );
  return (
    <View className={`w-full max-w-md p-4 ${className}`}>
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

      <Pressable
        onPress={onCancel}
        className="mt-5 w-full py-3 items-center justify-center active:opacity-60"
      >
        <Text className="text-[16px] font-medium text-muted">Cancelar</Text>
      </Pressable>
    </View>
  );
}
