import { baseautLogoXml } from "@/assets/baseaut-logo";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { usePasswordRecovery } from "@/features/auth/hooks/use-password-recovery";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

/** Which recovery action is currently in flight, for per-button feedback. */
type PendingAction = "code" | "verify" | null;

/**
 * Screen to start a password recovery. Sends a 6-digit code by e-mail that is
 * verified here before advancing to the reset screen.
 *
 * @remarks
 * The reset-by-link modality still exists in {@link usePasswordRecovery}
 * (`sendRecoveryLink`) but its UI entry point is intentionally disabled.
 */
export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const { sendRecoveryCode, verifyRecoveryCode, loading, error, setError } =
    usePasswordRecovery();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [action, setAction] = useState<PendingAction>(null);
  const [codeSent, setCodeSent] = useState(false);

  /** Validates the e-mail field and updates errors. */
  const validateEmail = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Sends the 6-digit recovery code to the e-mail. */
  const handleSendCode = async () => {
    if (!validateEmail()) return;
    setAction("code");
    const sent = await sendRecoveryCode(email);
    setAction(null);
    if (sent) {
      setCodeSent(true);
    }
  };

  /** Verifies the code and advances to the reset screen on success. */
  const handleConfirmCode = async () => {
    if (!validateEmail()) return;

    if (!/^\d{6}$/.test(code.trim())) {
      setErrors({ code: "O código deve conter 6 dígitos" });
      return;
    }

    setAction("verify");
    const verified = await verifyRecoveryCode(email, code);
    setAction(null);
    if (verified) {
      router.replace("/reset-password");
    }
  };

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow border border-outline">
          <Text className="text-header-3 text-content mb-5">Redefinir senha</Text>

          <View className="w-full max-w-[342px] gap-4">
            <View className="w-full gap-1">
              <Text className="text-default-2 text-muted">E-mail</Text>
              <DefaultTextInput
                placeholder="Seu e-mail"
                value={email}
                maxLength={254}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  if (error) setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={errors.email ? "border-error" : "border-outline"}
              />
              {errors.email ? (
                <Text className="text-default-3 text-error">{errors.email}</Text>
              ) : null}
            </View>

            <View className="w-full flex-row items-end gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-default-2 text-muted">Código</Text>
                <DefaultTextInput
                  placeholder="6 dígitos"
                  value={code}
                  maxLength={6}
                  onChangeText={(text) => {
                    setCode(text.replace(/\D/g, ""));
                    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                    if (error) setError(null);
                  }}
                  keyboardType="number-pad"
                  className="h-11 w-full rounded-[15px]"
                  outLineBorderClass={errors.code ? "border-error" : "border-outline"}
                />
              </View>
              <DefaultButton
                label={action === "code" ? "Enviando..." : "Enviar código"}
                onPress={handleSendCode}
                bgColorClass="bg-secondary"
                shadowClass="shadow-secondaryShadow"
                sizeClass="h-11 w-[140px]"
                className="rounded-[15px]"
                customTextSize="text-default-2"
                textClassName="text-white"
                disabled={loading}
              />
            </View>
            {errors.code ? (
              <Text className="text-default-3 text-error">{errors.code}</Text>
            ) : null}

            <DefaultButton
              label={action === "verify" ? "Verificando..." : "Confirmar código"}
              onPress={handleConfirmCode}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
              disabled={loading}
            />
          </View>

          {codeSent ? (
            <Text className="mt-6 text-default-3 text-secondary text-center">
              Se esse e-mail estiver cadastrado, você receberá um código em
              instantes.
            </Text>
          ) : null}
          {error ? (
            <Text className="mt-4 text-default-3 text-error text-center">{error}</Text>
          ) : null}

          <Pressable onPress={() => router.replace("/")} className="mt-6">
            <Text className="text-header-3 text-primary">Voltar ao login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
