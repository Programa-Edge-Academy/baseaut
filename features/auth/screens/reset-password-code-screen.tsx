import { baseautLogoXml } from "@/assets/baseaut-logo";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function readJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function sanitizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const initialEmail = String(params.email ?? "")
    .trim()
    .toLowerCase();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(Boolean(initialEmail));

  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  const canValidateCode =
    code.length === 6 && !sendingCode && !validatingCode;

  const handleCodeChange = (value: string) => {
    setCode(sanitizeCode(value));
    setCodeError("");
    setError(null);
  };

  const handleSendCode = async () => {
    setError(null);
    setEmailError("");
    setCodeError("");

    if (!normalizedEmail) {
      setEmailError("Email é obrigatório");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("E-mail inválido.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError("Configuração do Supabase ausente.");
      return;
    }

    setSendingCode(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-recovery-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      const data = await readJsonSafely(response);

      if (!response.ok) {
        setError(data.error ?? "Erro ao enviar código.");
        return;
      }

      setCode("");
      setCodeSent(true);

      Alert.alert("Sucesso", "Novo código enviado.");
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    setError(null);
    setEmailError("");
    setCodeError("");

    if (!normalizedEmail) {
      setEmailError("Email é obrigatório");
      return;
    }

    if (!code.trim()) {
      setCodeError("Campo obrigatório.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setCodeError("O código deve conter 6 dígitos.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError("Configuração do Supabase ausente.");
      return;
    }

    setValidatingCode(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-recovery-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            code,
          }),
        },
      );

      const data = await readJsonSafely(response);

      if (!response.ok) {
        const message = data.error ?? "Código inválido.";

        if (message === "Campo obrigatório.") {
          setCodeError("Campo obrigatório.");
          return;
        }

        if (message === "O código deve conter 6 dígitos.") {
          setCodeError("O código deve conter 6 dígitos.");
          return;
        }

        setError(message);
        return;
      }

      Alert.alert("Sucesso", "Código validado com sucesso.");

      router.push({
        pathname: "/reset-password",
        params: {
          email: normalizedEmail,
          code,
        },
      } as never);
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setValidatingCode(false);
    }
  };

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
          <Text className="mb-2 text-default-1 text-muted">
            Valide seu código
          </Text>

          <Text className="mb-5 text-center text-default-2 text-muted">
            O código foi enviado para o e-mail cadastrado.
          </Text>

          <View className="w-full max-w-[342px] gap-5">
            <View className="w-full">
              <DefaultTextInput
                placeholder="Email"
                className="h-11 w-full rounded-[15px]"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError("");
                  setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {emailError ? (
                <Text className="mt-1 text-sm text-red-400">
                  {emailError}
                </Text>
              ) : null}
            </View>

            <View className="w-full">
              <DefaultTextInput
                placeholder="Código de 6 dígitos"
                className="h-11 w-full rounded-[15px]"
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
              />

              {codeError ? (
                <Text className="mt-1 text-sm text-red-400">
                  {codeError}
                </Text>
              ) : null}
            </View>
          </View>

          {error ? (
            <Text className="mt-3 text-center text-red-400">{error}</Text>
          ) : null}

          <View className="mt-7 w-full max-w-[342px] items-center gap-3">
            <DefaultButton
              label={validatingCode ? "Validando..." : "Validar código"}
              onPress={handleConfirmCode}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
              disabled={!canValidateCode}
            />

            <DefaultButton
              label={
                sendingCode
                  ? "Enviando..."
                  : codeSent
                    ? "Reenviar código"
                    : "Enviar código"
              }
              onPress={handleSendCode}
              bgColorClass="bg-secondary"
              shadowClass="shadow-secondaryShadow"
              sizeClass="w-full h-11"
              className="rounded-[15px]"
              disabled={sendingCode || validatingCode}
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