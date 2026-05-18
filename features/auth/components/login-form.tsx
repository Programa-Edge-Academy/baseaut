import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useLogin } from "@/features/auth/hooks/use-login";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

const translateAuthError = (msg: string | null | undefined) => {
  if (!msg) return null;
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (lowerMsg.includes("user already registered")) return "Este e-mail já está cadastrado.";
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests")) return "Muitas tentativas. Tente novamente mais tarde.";
  if (lowerMsg.includes("60 seconds")) return "Aguarde 60 segundos para tentar novamente.";
  if (lowerMsg.includes("email not confirmed")) return "E-mail não confirmado.";
  return "Ocorreu um erro. Verifique seus dados e tente novamente.";
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error: apiError, isPendingApproval } = useLogin();
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email inválido";
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;    
    const success = await login(email, password);
    if (success) {
      router.replace("/students");
    }
  };

  const displayApiError = translateAuthError(apiError);

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-header-3 text-white">Entre na sua conta</Text>

      <View className="w-full max-w-[342px] gap-4">
        <View className="w-full gap-1">
          <Text className="text-default-2 text-muted">E-mail</Text>
          <DefaultTextInput
            placeholder="Seu e-mail"
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={localErrors.email ? "border-error" : "border-outline"}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (localErrors.email) setLocalErrors({});
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={254}
          />
          {localErrors.email ? (<Text className="text-default-3 text-error">{localErrors.email}</Text>) : null}
        </View>
        <View className="w-full gap-1">
          <Text className="text-default-2 text-muted">Senha</Text>
          <PasswordInput
            placeholder="Sua senha"
            maxLength={20}
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={localErrors.password ? "border-error" : "border-outline"}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (localErrors.password) setLocalErrors({});
            }}
          />
          {localErrors.password ? (<Text className="text-default-3 text-error">{localErrors.password}</Text>) : null}
        </View>
      </View>

      {isPendingApproval ? (
        <Text className="mt-3 text-default-3 text-extra text-center">Seu cadastro ainda está aguardando aprovação.</Text>
      ) : displayApiError ? (
        <Text className="mt-3 text-default-3 text-error text-center">{displayApiError}</Text>
      ) : null}

      <View className="mt-7 w-full max-w-[342px] items-center">
        <DefaultButton
          label={loading ? "Entrando..." : "Entrar"}
          onPress={handleSubmit}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
          disabled={loading}
        />
      </View>

      <View className="mt-7 items-center gap-3">
        <View className="flex-row items-center">
          <Text className="text-muted text-header-3">Não tem conta? </Text>
          <Pressable onPress={() => router.push("/register" as never)}>
            <Text className="text-secondary text-header-3">Cadastre-se</Text>
          </Pressable>
        </View>
        <Pressable>
          <Text
            className="text-header-3 text-primary"
            onPress={() => router.push("/reset-password-code" as never)}
          >
            Esqueci a senha
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
