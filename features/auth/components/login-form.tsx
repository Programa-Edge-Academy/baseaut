import React from "react";
import { Pressable, Text, View } from "react-native";
import { DefaultButton } from "../../../components/default-button";
import { DefaultTextInput } from "../../../components/default-text-input";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const handleLogin = () => {
    console.log("Login tentado");
  };

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-default-1 text-muted">Entre na sua conta</Text>

      <View className="w-full max-w-[342px] gap-7">
        <DefaultTextInput
          placeholder="Email"
          className="h-11 w-full rounded-[15px]"
        />
        <PasswordInput
          placeholder="Senha"
          className="h-11 w-full rounded-[15px]"
        />
      </View>

      <View className="mt-7 w-full max-w-[342px] items-center">
        <DefaultButton
          label="Entrar"
          onPress={handleLogin}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
        />
      </View>

      <View className="mt-7 items-center gap-3">
        <Text className="text-default-2">
          <Text className="text-muted">Não tem conta? </Text>
          <Text className="text-secondary">Cadastre-se</Text>
        </Text>
        <Pressable>
          <Text className="text-default-2 text-primary">Esqueci a senha</Text>
        </Pressable>
      </View>
    </View>
  );
}
