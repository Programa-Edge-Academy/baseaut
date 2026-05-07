import React from "react";
import { View, Text, Pressable } from "react-native";
import { KeyRound, Copy, RefreshCw } from "lucide-react-native";

interface TeamCodeCardProps {
  code: string;
  onCopy?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function TeamCodeCard({ 
  code = "TMA2026", 
  onCopy, 
  onRefresh,
  className 
}: TeamCodeCardProps) {
  return (
    <View 
      className={`w-full max-w-[380px] rounded-[20px] bg-[#181C25] p-5 shadow-lg ${className ?? ""}`}
    >
      {/* Cabeçalho com Ícone de Chave */}
      <View className="mb-4 flex-row items-center gap-3">
        <KeyRound size={24} color="#0E89E5" />
        <Text className="text-lg font-bold text-white">
          Código da equipe
        </Text>
      </View>

      {/* Área do Código e Botões de Ação */}
      <View className="flex-row items-center gap-3">
        {/* Box do Código */}
        <View className="h-[60px] flex-1 items-center justify-center rounded-[15px] bg-[#1F2531]">
          <Text className="text-2xl font-black tracking-widest text-white">
            {code}
          </Text>
        </View>

        {/* Botões Laterais */}
        <View className="flex-row gap-2">
          <Pressable 
            onPress={onCopy}
            className="h-[44px] w-[44px] items-center justify-center rounded-xl active:opacity-70"
          >
            <Copy size={20} color="#66758A" />
          </Pressable>

          <Pressable 
            onPress={onRefresh}
            className="h-[44px] w-[44px] items-center justify-center rounded-xl bg- active:opacity-70"
          >
            <RefreshCw size={20} color="#66758A" />
          </Pressable>
        </View>
      </View>

      {/* Texto de Ajuda (Footer) */}
      <Text className="mt-4 text-s font-medium text-[#66758A]">
        Monitores usam este código para entrar na equipe.
      </Text>
    </View>
  );
}