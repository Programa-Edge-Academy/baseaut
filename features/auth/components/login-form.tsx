import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { DefaultButton } from "../../../components/default-button";
import { DefaultTextInput } from "../../../components/default-text-input";
import { supabase } from "../../../lib/supabase";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const resp = await supabase.auth.signInWithPassword({ email, password });

      if (resp.error) {
        setError(resp.error.message);
        Alert.alert("Erro ao entrar", resp.error.message);
        return;
      }

      // Successful sign-in
      Alert.alert("Sucesso", "Autenticado com sucesso");
      // TODO: navigate to the app main screen
    } catch (err: any) {
      setError(err?.message ?? "Erro desconhecido");
      Alert.alert("Erro", err?.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-default-1 text-muted">Entre na sua conta</Text>

      <View className="w-full max-w-[342px] gap-7">
        <DefaultTextInput
          placeholder="Email"
          className="h-11 w-full rounded-[15px]"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PasswordInput
          placeholder="Senha"
          className="h-11 w-full rounded-[15px]"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? <Text className="mt-3 text-red-400">{error}</Text> : null}

      <View className="mt-7 w-full max-w-[342px] items-center">
        <DefaultButton
          label={loading ? "Entrando..." : "Entrar"}
          onPress={handleLogin}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
          disabled={loading}
        />
        {loading ? <ActivityIndicator className="mt-3" /> : null}
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
