import { baseautLogoXml } from "@/assets/baseaut-logo";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { usePasswordRecovery } from "@/features/auth/hooks/use-password-recovery";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

/** Which recovery action is currently in flight, for per-button feedback. */
type PendingAction = "send" | "verify" | null;

/**
 * Screen to start a password recovery. Sends the native Supabase recovery
 * e-mail, which carries both a 8-digit code (`{{ .Token }}`) and a reset link.
 *
 * @remarks
 * The code is verified natively via {@link usePasswordRecovery.verifyRecoveryOtp}
 * (`supabase.auth.verifyOtp`) — no Edge Function or external provider. The code
 * is preferred over the link for institutional inboxes, whose security scanners
 * pre-open (and thus consume) one-time links before the user taps them; the link
 * remains available in the same e-mail for phones with the app installed.
 */
export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const { sendRecoveryLink, verifyRecoveryOtp, loading, error, setError } =
    usePasswordRecovery();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [action, setAction] = useState<PendingAction>(null);
  const [sent, setSent] = useState(false);

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

  /** Sends the recovery e-mail (code + link) to the given address. */
  const handleSend = async () => {
    if (!validateEmail()) return;
    setAction("send");
    const ok = await sendRecoveryLink(email);
    setAction(null);
    if (ok) setSent(true);
  };

  /** Verifies the 8-digit code and advances to the reset screen on success. */
  const handleConfirmCode = async () => {
    if (!validateEmail()) return;

    if (!/^\d{8}$/.test(code.trim())) {
      setErrors({ code: "O código deve conter 8 dígitos" });
      return;
    }

    setAction("verify");
    const verified = await verifyRecoveryOtp(email, code);
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

            <DefaultButton
              label={action === "send" ? "Enviando..." : "Enviar código por e-mail"}
              onPress={handleSend}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
              disabled={loading}
            />

            <View className="w-full gap-1">
              <Text className="text-default-2 text-muted">Código</Text>
              <DefaultTextInput
                placeholder="8 dígitos"
                value={code}
                maxLength={8}
                onChangeText={(text) => {
                  setCode(text.replace(/\D/g, ""));
                  if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                  if (error) setError(null);
                }}
                keyboardType="number-pad"
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={errors.code ? "border-error" : "border-outline"}
              />
              {errors.code ? (
                <Text className="text-default-3 text-error">{errors.code}</Text>
              ) : null}
            </View>

            <DefaultButton
              label={action === "verify" ? "Verificando..." : "Confirmar código"}
              onPress={handleConfirmCode}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
              bgColorClass="bg-secondary"
              shadowClass="shadow-secondaryShadow"
              disabled={loading}
            />
          </View>

          {sent ? (
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
