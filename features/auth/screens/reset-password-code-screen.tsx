import { baseautLogoXml } from "@/assets/baseaut-logo";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { usePasswordRecovery } from "@/features/auth/hooks/use-password-recovery";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

/**
 * Screen to request a password recovery code by e-mail.
 */
export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const { sendRecoveryCode, loading, error, setError } = usePasswordRecovery();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates the email input and updates errors.
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Requests the recovery code and advances to the reset screen on success.
   */
  const handleSendInstructions = async () => {
    if (!validate()) return;

    const sent = await sendRecoveryCode(email);
    if (!sent) return;

    router.push({
      pathname: "/reset-password",
      params: { email: email.trim().toLowerCase() },
    });
  };

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow border border-outline">
          <Text className="text-header-3 text-content mb-5">Redefinir senha</Text>

          <View className="w-full gap-7">
            <View className="w-full gap-1">
              <Text className="text-default-2 text-muted">E-mail</Text>
              <DefaultTextInput
                placeholder="Seu e-mail"
                value={email}
                maxLength={254}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({});
                  if (error) setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={
                  errors.email ? "border-error" : "border-outline"
                }
              />
              {errors.email && (
                <Text className="text-default-3 text-error">
                  {errors.email}
                </Text>
              )}
              {error && (
                <Text className="text-default-3 text-error">{error}</Text>
              )}
            </View>

            <DefaultButton
              className="w-full h-11"
              label={loading ? "Enviando..." : "Enviar solicitação"}
              onPress={handleSendInstructions}
              disabled={loading}
            />
          </View>

          <Pressable onPress={() => router.replace("/")} className="mt-7">
            <Text className="text-header-3 text-primary">Voltar ao login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
