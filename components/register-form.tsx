import React from "react";
import { View, Text, Pressable } from "react-native";
import { Phone } from "lucide-react-native"; // Usando Lucide para o ícone de telefone
import { DefaultTextInput } from "./default-text-input";
import { PasswordInput } from "./password-input";
import { DefaultButton } from "./default-button";

export function RegisterForm() {
  const handleRegister = () => {
    console.log("Cadastro tentado");
  };

  return (
    // Container com background #181C25 e arredondamento de 20px
    <View className="w-full max-w-[380px] items-center rounded-[20px] bg-[#1B1F27] p-6 shadow-lg">
      
      {/* Título centralizado */}
      <Text className="mb-6 text-xl font-bold text-[#66758A]">
        Crie sua conta
      </Text>

      <View className="w-full gap-4">
        {/* Campo de Nome */}
        <DefaultTextInput placeholder="Nome completo" />

        {/* Seção Email com link para Telefone */}
        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-400">Email</Text>
            <Pressable className="flex-row items-center gap-1">
              <Phone size={14} color="#1DB954" />
              <Text className="text-xs font-bold text-[#1DB954]">
                Cadastrar-se com telefone
              </Text>
            </Pressable>
          </View>
          <DefaultTextInput placeholder="Seu email" />
        </View>

        {/* Campos de Senha reutilizando a lógica de visibilidade */}
        <PasswordInput placeholder="Digite sua senha" />
        <PasswordInput placeholder="Confirme sua senha" />
      </View>

      {/* Botão de Cadastro */}
      <View className="mt-8 w-full items-center">
        <DefaultButton label="Cadastrar-se" onPress={handleRegister} />
      </View>

      {/* Rodapé com link para Login */}
      <View className="mt-6 items-center">
        <Text className="text-sm text-gray-400">
          Já tem conta? <Text className="font-bold text-[#0E89E5]">Entre</Text>
        </Text>
      </View>

    </View>
  );
}