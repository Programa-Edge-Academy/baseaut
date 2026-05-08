import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "../../../assets/baseaut-logo";
import { supabase } from "../../../lib/supabase";

export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string>("");

  const handleResetPasswordCode = async () => {
    setError(null);
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const { error: recoverError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          // Supabase JS expects redirectTo at top-level for this method
          redirectTo: "baseaut://reset-password",
        },
      );

      if (recoverError) {
        setError(recoverError.message);
        Alert.alert("Erro ao recuperar senha", recoverError.message);
        return;
      }

      Alert.alert(
        "Sucesso",
        "Se esse email estiver cadastrado, você receberá um link para redefinir sua senha.",
      );
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = () => {
    router.push("/reset-password" as never);
  };

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
          <Text className="mb-5 text-default-1 text-muted">
            Redefina sua senha
          </Text>

          <View className="w-full max-w-[342px] gap-7">
            <View className="w-full">
              <DefaultTextInput
                placeholder="Email"
                className="h-11 w-full rounded-[15px]"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text className="mt-1 text-sm text-red-400">{emailError}</Text>
              ) : null}
            </View>

            <View className="w-full flex-row items-center gap-3">
              <DefaultTextInput
                placeholder="Código de 6 dígitos"
                className="h-11 flex-1 rounded-[15px] w-[140px]"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              <DefaultButton
                label={loading ? "Enviando..." : "Enviar código"}
                onPress={handleResetPasswordCode}
                bgColorClass="bg-secondary"
                shadowClass="shadow-secondaryShadow"
                sizeClass="h-11 w-[140px]"
                className="rounded-[15px]"
                disabled={loading}
              />
            </View>
          </View>

          {error ? <Text className="mt-3 text-red-400">{error}</Text> : null}

          <View className="mt-7 w-full max-w-[342px] items-center">
            <DefaultButton
              label="Confirmar código"
              onPress={handleConfirmCode}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
            />
          </View>

          <View className="mt-6 items-center">
            <Pressable onPress={() => router.replace("/" as never)}>
              <Text className="text-default-2 text-primary">
                Voltar ao login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
