import React from "react";
import { Pressable, Text, View } from "react-native";
import { DefaultButton } from "../../../components/default-button";
import { DefaultTextInput } from "../../../components/default-text-input";
import { PasswordInput } from "./password-input";

type LoginFormProps = {
  email: string;
  password: string;
  loading?: boolean;
  error?: string | null;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
};

export function LoginForm({
  email,
  password,
  loading = false,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-default-1 text-muted">Entre na sua conta</Text>

      <View className="w-full max-w-[342px] gap-7">
        <DefaultTextInput
          placeholder="Email"
          className="h-11 w-full rounded-[15px]"
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PasswordInput
          placeholder="Senha"
          className="h-11 w-full rounded-[15px]"
          value={password}
          onChangeText={onPasswordChange}
        />
      </View>

      {error ? <Text className="mt-3 text-red-400">{error}</Text> : null}

      <View className="mt-7 w-full max-w-[342px] items-center">
        <DefaultButton
          label={loading ? "Entrando..." : "Entrar"}
          onPress={onSubmit}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
          disabled={loading}
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
