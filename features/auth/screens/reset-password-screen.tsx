import { DefaultButton } from "@/components/default-button";
import { passwordChecker } from "@/features/auth/hooks/password-checker";
import { usePasswordRecovery } from "@/features/auth/hooks/use-password-recovery";
import { useRecoverySession } from "@/features/auth/hooks/use-recovery-session";
import { colors } from "@/assets/colors";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "@/components/keyboard-aware-scroll-view";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "@/assets/baseaut-logo";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useI18n } from "@/features/settings/contexts/i18n-context";

/**
 * Screen to set a new password. Reached with a live recovery session — either
 * from the reset link deep link or after the code was verified — so it only
 * collects the new password and applies it via {@link usePasswordRecovery}.
 */
export function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const sessionStatus = useRecoverySession();
  const { updatePassword, loading, error, setError } = usePasswordRecovery();
  const invalidPasswordMessage = t("auth.passwordRule");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      newErrors.confirmPassword = t("auth.passwordsMismatch");
    } else if (confirmPassword && text === confirmPassword) {
      delete newErrors.confirmPassword;
    }

    setPassword(text);
    setErrors(newErrors);
    if (error) setError(null);
  };

  /**
   * Updates the confirm password field and checks for a match.
   */
  const handleConfirmPasswordChange = (text: string) => {
    const newErrors: Record<string, string> = { ...errors };

    if (password !== text) {
      newErrors.confirmPassword = t("auth.passwordsMismatch");
    } else {
      delete newErrors.confirmPassword;
    }

    setConfirmPassword(text);
    setErrors(newErrors);
    if (error) setError(null);
  };

  /**
   * Validates the form fields and updates errors.
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!password.trim()) {
      newErrors.password = t("auth.passwordRequired");
    } else if (!passwordChecker(password)) {
      newErrors.password = invalidPasswordMessage;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t("auth.confirmRequired");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("auth.passwordsMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Applies the new password and forwards to the success feedback.
   */
  const handleResetPassword = async () => {
    if (!validate()) return;

    const updated = await updatePassword(password);
    if (!updated) return;

    router.replace({
      pathname: "/auth-feedback",
      params: { mode: "passwordUpdated" },
    });
  };

  const isButtonDisabled = !password || !confirmPassword || loading;

  if (sessionStatus === "checking") {
    return (
      <View className="flex-1 items-center justify-center bg-level1">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <KeyboardAwareScrollView
        className="flex-1 bg-level1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 items-center bg-level1 px-4 pt-10">
        <View className="w-full mt-12 pt-12 items-center">
          <SvgXml xml={baseautLogoXml} width={196} height={70} />
        </View>

        <View className="mt-10 w-full items-center">
          <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow border border-outline">
            <Text className="mb-5 text-header-3 text-content">{t("auth.resetTitle")}</Text>

            {sessionStatus === "invalid" ? (
              <>
                <Text className="text-default-2 text-muted text-center leading-5">
                  {t("auth.resetInvalid")}
                </Text>
                <View className="mt-7 w-full max-w-[342px] items-center">
                  <DefaultButton
                    label={t("auth.requestAgain")}
                    onPress={() => router.replace("/reset-password-code")}
                    sizeClass="w-full h-11"
                    className="rounded-[15px]"
                  />
                </View>
                <Pressable onPress={() => router.replace("/")} className="mt-6">
                  <Text className="text-header-3 text-primary">{t("auth.backToLogin")}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View className="w-full max-w-[342px] gap-4">
                  <View className="gap-1">
                    <Text className="text-default-2 text-muted">{t("account.newPassword")}</Text>
                    <PasswordInput
                      placeholder={t("auth.newPasswordPlaceholder")}
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
                      {t("account.confirmNewPassword")}
                    </Text>
                    <PasswordInput
                      placeholder={t("auth.confirmNewPasswordPlaceholder")}
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
                    label={loading ? t("common.saving") : t("auth.confirmPasswordBtn")}
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
              </>
            )}
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
