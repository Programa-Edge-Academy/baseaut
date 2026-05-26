import { DefaultButton } from "@/components/default-button";
import { passwordChecker } from "@/features/auth/hooks/password-checker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "@/assets/baseaut-logo";
import { PasswordInput } from "@/features/auth/components/password-input";
import { supabase } from "@/lib/supabase";

const invalidPasswordMessage =
  "A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial";

/**
 * Maps Supabase reset errors to localized UI-friendly messages.
 */
const translateResetError = (msg: string | null | undefined) => {
  if (!msg) return null;
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes("new password should be different") || lowerMsg.includes("same as the old password")) {
    return "A nova senha não pode ser igual à senha anterior.";
  }
  if (lowerMsg.includes("session missing") || lowerMsg.includes("unauthorized") || lowerMsg.includes("jwt") || lowerMsg.includes("expired") || lowerMsg.includes("invalid token")) {
    return "Link de redefinição inválido ou expirado. Por favor, solicite um novo.";
  }
  return "Ocorreu um erro ao redefinir a senha. Tente novamente.";
};

/**
 * Screen to update the user password after recovery.
 */
export function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Updates the password field and performs live validation.
   */
  const handlePasswordChange = (text: string) => {
    const newErrors: Record<string, string> = { ...errors };

    if (!passwordChecker(text)) {
      newErrors.password = invalidPasswordMessage;
    } else {
      delete newErrors.password;
    }

    if (confirmPassword && text !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    } else if (confirmPassword && text === confirmPassword) {
      delete newErrors.confirmPassword;
    }

    setPassword(text);
    setErrors(newErrors);
  };

  /**
   * Updates the confirm password field and checks for a match.
   */
  const handleConfirmPasswordChange = (text: string) => {
    const newErrors: Record<string, string> = { ...errors };

    if (password !== text) {
      newErrors.confirmPassword = "As senhas não coincidem";
    } else {
      delete newErrors.confirmPassword;
    }

    setConfirmPassword(text);
    setErrors(newErrors);
  };

  /**
   * Validates the reset password form fields and updates errors.
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (!passwordChecker(password)) {
      newErrors.password = invalidPasswordMessage;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submits the password update to Supabase.
   */
  const handleResetPassword = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError(null);


    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setApiError(translateResetError(error.message));
        return;
      }

      Alert.alert("Sucesso", "Senha redefinida com sucesso.");

      router.replace({
        pathname: "/auth-feedback",
        params: { mode: "passwordUpdated" },
      });
    } catch (error: any) {
      setApiError(error.message || "Ocorreu um erro ao redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !password || !confirmPassword || loading;

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
          <Text className="mb-5 text-header-3 text-white">Redefinir senha</Text>

          <View className="w-full max-w-[342px] gap-4">
            <View className="gap-1">
              <Text className="text-default-2 text-muted">Nova senha</Text>
              <PasswordInput
                placeholder="Digite sua nova senha"
                value={password}
                maxLength={20}
                onChangeText={handlePasswordChange}
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={
                  errors.password ? "border-error" : "border-outline"
                }
              />
              {errors.password && (
                <Text className="text-default-3 text-error">
                  {errors.password}
                </Text>
              )}
            </View>

            <View className="gap-1">
              <Text className="text-default-2 text-muted">
                Confirmar nova senha
              </Text>
              <PasswordInput
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                maxLength={20}
                onChangeText={handleConfirmPasswordChange}
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={
                  errors.confirmPassword ? "border-error" : "border-outline"
                }
              />
              {errors.confirmPassword && (
                <Text className="text-default-3 text-error">
                  {errors.confirmPassword}
                </Text>
              )}
            </View>
                        
            {apiError && (
              <Text className="text-default-3 text-error text-center mt-1">
                {apiError}
              </Text>
            )}
          </View>

          <View className="mt-7 w-full max-w-[342px] items-center">
            <DefaultButton
              label={loading ? "Salvando..." : "Confirmar senha"}
              onPress={handleResetPassword}
              sizeClass="w-full h-11"
              disabled={isButtonDisabled}
              bgColorClass={isButtonDisabled ? "bg-muted" : "bg-primary"}
              shadowClass={
                isButtonDisabled ? "shadow-none" : "shadow-primaryShadow"
              }
              className={`rounded-[15px] ${isButtonDisabled ? "border border-outline" : ""}`}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
