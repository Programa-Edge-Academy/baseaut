import React, { useState } from "react";
import { View, Text, Switch } from "react-native";
import { Share2 } from "lucide-react-native";

interface FamilyShareCardProps {
  onValueChange?: (value: boolean) => void;
  className?: string;
}

export function FamilyShareCard({ onValueChange, className }: FamilyShareCardProps) {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => {
    setIsEnabled((previousState) => !previousState);
    if (onValueChange) onValueChange(!isEnabled);
  };

  return (
    <View 
      className={`w-full max-w-[380px] rounded-[20px] bg-[#181C25] p-5 shadow-lg ${className ?? ""}`}
    >
      {/* Linha Superior: Ícone, Título e Switch */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Share2 size={24} color="#1DB954" />
          <Text className="text-lg font-bold text-white">
            Compartilhar em família
          </Text>
        </View>

        <Switch
          trackColor={{ false: "#2B303B", true: "#1DB954" }}
          thumbColor={isEnabled ? "#FFFFFF" : "#F4F3F4"}
          ios_backgroundColor="#2B303B"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      {/* Descrição Inferior */}
      <View className="mt-4">
        <Text className="text-[14px] font-medium leading-5 text-[#66758A]">
          Ative para agrupar alunos com um código compartilhado.
        </Text>
      </View>
    </View>
  );
}