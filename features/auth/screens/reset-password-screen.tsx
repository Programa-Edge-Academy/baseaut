import { DefaultButton } from "@/components/default-button";
import { useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "../../../assets/baseaut-logo";
import { PasswordInput } from "../components/password-input";

const weakPasswordMessage =
  "Senha fraca. Use de 8 a 20 caracteres,\n" +
  "incluindo letras, numeros e 1 caractere especial.";

const isStrongPassword = (value: string) => {
  if (value.length < 8 || value.length > 20) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
};

export function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [weakPassword, setWeakPassword] = useState(false);

  const handleConfirmPassword = () => {
    const isWeak = !isStrongPassword(password);
    setWeakPassword(isWeak);

    if (isWeak) {
      setError(weakPasswordMessage);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    setError(null);
    Alert.alert("Sucesso", "Senha redefinida com sucesso.");
    router.replace("/" as never);
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
              placeholder="Digite sua nova senha"
              value={password}
              onChangeText={setPassword}
              className={weakPassword ? "border-error" : ""}
            />

            <PasswordInput
              placeholder="Confirme sua nova senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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

          <View className="mt-7 w-full max-w-[342px] items-center">
            <DefaultButton
              label="Confirmar senha"
              onPress={handleConfirmPassword}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
