import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { passwordChecker } from "@/features/auth/hooks/password-checker";
import { usePasswordRecovery } from "@/features/auth/hooks/use-password-recovery";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "@/assets/baseaut-logo";
import { PasswordInput } from "@/features/auth/components/password-input";

const invalidPasswordMessage =
  "A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial";

/**
 * Screen to validate the recovery code and set a new password.
 */
export function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyRecoveryCode, loading, error, setError } =
    usePasswordRecovery();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Updates the recovery code field and clears any pending API error.
   */
  const handleCodeChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "");
    setCode(digitsOnly);

    if (errors.code) {
      const newErrors = { ...errors };
      delete newErrors.code;
      setErrors(newErrors);
    }
    if (error) setError(null);
  };

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

    if (!code.trim()) {
      newErrors.code = "Código é obrigatório";
    } else if (!/^\d{6}$/.test(code.trim())) {
      newErrors.code = "O código deve conter 6 dígitos";
    }

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
   * Validates the code and submits the new password to the recovery service.
   */
  const handleResetPassword = async () => {
    if (!validate()) return;

    if (!email) {
      setError("Sessão de recuperação inválida. Solicite um novo código.");
      return;
    }

    const updated = await verifyRecoveryCode({
      email,
      code,
      newPassword: password,
    });

    if (!updated) return;

    router.replace({
      pathname: "/auth-feedback",
      params: { mode: "passwordUpdated" },
    });
  };

  const isButtonDisabled = !code || !password || !confirmPassword || loading;

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
          <Text className="mb-5 text-header-3 text-content">Redefinir senha</Text>

          <View className="w-full max-w-[342px] gap-4">
            <View className="gap-1">
              <Text className="text-default-2 text-muted">
                Código de verificação
              </Text>
              <DefaultTextInput
                placeholder="Digite o código de 6 dígitos"
                value={code}
                maxLength={6}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={
                  errors.code ? "border-error" : "border-outline"
                }
              />
              {errors.code && (
                <Text className="text-default-3 text-error">{errors.code}</Text>
              )}
            </View>

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

            {error && (
              <Text className="text-default-3 text-error text-center mt-1">
                {error}
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
