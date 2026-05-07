import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { DefaultButton } from "../../../components/default-button";
import { DefaultTextInput } from "../../../components/default-text-input";
import { PasswordInput } from "./password-input";
import { passwordChecker } from "../hooks/password-checker";
import { useRegister } from "../hooks/use-register";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, loading, error: apiError } = useRegister();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    if (!passwordChecker(password)) {
      newErrors.password =
        "A senha deve ter 8+ caracteres, maiúscula, minúscula e número";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const success = await register({ name, email, password });
    if (success) {
      router.replace("/login");
    }
  };

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-default-1 text-muted">Crie sua conta</Text>

      <View className="w-full max-w-[342px] gap-4">
        <View className="gap-1">
          <DefaultTextInput
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            className="h-11 w-full rounded-[15px]"
          />
          {errors.name && (
            <Text className="text-xs text-red-400">{errors.name}</Text>
          )}
        </View>

        <View className="gap-1">
          <Text className="text-xs font-medium text-muted">Email</Text>
          <DefaultTextInput
            placeholder="Seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="h-11 w-full rounded-[15px]"
          />
          {errors.email && (
            <Text className="text-xs text-red-400">{errors.email}</Text>
          )}
        </View>

        <View className="gap-1">
          <PasswordInput
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            className="h-11 w-full rounded-[15px]"
          />
          {errors.password && (
            <Text className="text-xs text-red-400">{errors.password}</Text>
          )}
        </View>

        <View className="gap-1">
          <PasswordInput
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            className="h-11 w-full rounded-[15px]"
          />
          {errors.confirmPassword && (
            <Text className="text-xs text-red-400">
              {errors.confirmPassword}
            </Text>
          )}
        </View>
      </View>

      <View className="mt-7 w-full max-w-[342px] items-center gap-2">
        <DefaultButton
          label={loading ? "Cadastrando..." : "Cadastrar-se"}
          onPress={handleRegister}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
          disabled={loading}
        />
        {apiError && (
          <Text className="text-xs text-red-400">{apiError}</Text>
        )}
      </View>

      <View className="mt-6 items-center">
        <Pressable onPress={() => router.replace("/login")}>
          <Text className="text-default-2">
            <Text className="text-muted">Já tem conta? </Text>
            <Text className="text-secondary">Entre</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
