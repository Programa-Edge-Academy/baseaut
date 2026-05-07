import React from "react";
import { Pressable, Text, View } from "react-native";
import { DefaultButton } from "./default-button";
import { DefaultTextInput } from "./default-text-input";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const handleLogin = () => {
    console.log("Login tentado");
  };

  return (
    <View className="w-full max-w-[380px] items-center rounded-[20px] bg-[#1B1F27] p-6 shadow-lg">
      {/* Título */}
      <Text className="mb-6 text-xl font-bold text-[#66758A]">
        Entre na sua conta
      </Text>

      {/* Campos de Input */}
      <View className="w-full gap-4">
        <DefaultTextInput placeholder="Email ou telefone" />
        <PasswordInput placeholder="Senha" />
      </View>

      {/* Botão de Ação */}
      <View className="mt-6 w-full items-center">
        <DefaultButton label="Entrar" onPress={handleLogin} />
      </View>

      {/* Links de Rodapé */}
      <View className="mt-6 items-center gap-3">
        <Text className="text-sm text-gray-400">
          Não tem conta?{" "}
          <Text className="font-bold text-[#25C125]">Cadastre-se</Text>
        </Text>
        <Pressable>
          <Text className="text-sm font-medium text-[#0E89E5]">
            Esqueci a senha
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
