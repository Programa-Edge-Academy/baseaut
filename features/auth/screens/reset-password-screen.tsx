import { baseautLogoXml } from "@/assets/baseaut-logo";
import { DefaultButton } from "@/components/default-button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { PasswordInput } from "../components/password-input";

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const passwordSecurityMessage =
  "A senha não atende aos requisitos de segurança.";

function isStrongPassword(value: string) {
  if (value.length < 8 || value.length > 20) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;

  return true;
}

async function readJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();

  const email = String(params.email ?? "")
    .trim()
    .toLowerCase();

  const code = String(params.code ?? "").trim();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [weakPassword, setWeakPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    password.length > 0 && confirmPassword.length > 0 && !loading;

  useEffect(() => {
    if (!email || !/^\d{6}$/.test(code)) {
      setError("Sessão de recuperação expirada. Solicite um novo código.");
    }
  }, [email, code]);

  const handleConfirmPassword = async () => {
    setError(null);

    if (!email || !/^\d{6}$/.test(code)) {
      setError("Sessão de recuperação expirada. Solicite um novo código.");
      router.replace("/reset-password-code" as never);
      return;
    }

    const isWeak = !isStrongPassword(password);
    setWeakPassword(isWeak);

    if (isWeak) {
      setError(passwordSecurityMessage);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError("Configuração do Supabase ausente.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            code,
            new_password: password,
          }),
        },
      );

      const data = await readJsonSafely(response);

      if (!response.ok) {
        const message =
          data.error ?? "Erro ao redefinir senha. Tente novamente.";

        if (
          message === "Sessão de recuperação expirada. Solicite um novo código."
        ) {
          setError("Sessão de recuperação expirada. Solicite um novo código.");
          router.replace("/reset-password-code" as never);
          return;
        }

        setError(message);
        return;
      }

      Alert.alert("Sucesso", "Senha redefinida com sucesso.");
      router.replace("/" as never);
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
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
            <PasswordInput
              placeholder="Nova senha"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setWeakPassword(false);
                setError(null);
              }}
              className={weakPassword ? "border-error" : ""}
            />

            <PasswordInput
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError(null);
              }}
            />
          </View>

          {error ? (
            <View className="mt-4 w-full max-w-[342px] flex-row items-center gap-3 rounded-[11px] bg-error/20 px-3 py-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-error/20">
                <AlertCircle size={18} color="#FF383C" />
              </View>

              <Text className="flex-1 text-[11px] leading-5 text-error">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mt-7 w-full max-w-[342px] items-center gap-4">
            <DefaultButton
              label={loading ? "Redefinindo..." : "Redefinir senha"}
              onPress={handleConfirmPassword}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
              disabled={!canSubmit}
            />

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