import React from "react";
import { View, Text, Pressable } from "react-native";
import { GraduationCap } from "lucide-react-native";
import { CompanionItem } from "./companion-item";
import { colors } from "@/assets/colors";

export function CompanionCard({ className }: { className?: string }) {
  return (
    <View className={`w-full max-w-[380px] rounded-[20px] bg-level2 p-5 shadow-lg ${className ?? ""}`}>
      {/* Header Fixo */}
      <View className="mb-5 flex-row items-center gap-3">
        <GraduationCap size={24} color={colors.secondary} />
        <Text className="text-lg font-bold text-white">
          Acompanhantes (2)
        </Text>
      </View>

      {/* Lista de Itens Manual*/}
      <CompanionItem 
        name="Ana Clara"
        email="ana.clara@baseaut.com"
        onRemove={() => console.log("Remove Ana")} 
      />
      
      {/* Divisor visual opcional entre os dois */}
      <View className="h-[1px] bg-outline my-2 w-full opacity-50" />

      <CompanionItem 
        name="José Riquelme" 
        email="jose.riquelme@baseaut.com" 
        onRemove={() => console.log("Remove José")} 
      />
    </View>
  );
}