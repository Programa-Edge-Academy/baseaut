import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { passwordChecker } from "@/features/auth/hooks/password-checker";
import { useGoogleAuth } from "@/features/auth/hooks/use-google-auth";
import { useRegister } from "@/features/auth/hooks/use-register";
import { translateAuthError } from "@/features/auth/utils/translate-auth-error";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { googleLogoXml } from "@/assets/google-logo";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

/**
 * Registration form UI with validation and submit handling. Creates the
 * account with an e-mail address or a Google account.
 */
export function RegisterForm() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, loading, error: apiError } = useRegister();
  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
    isPendingApproval: isGooglePending,
  } = useGoogleAuth();

  /**
   * Updates the password field and runs live validation.
   */
  const handlePasswordChange = (text: string) => {
    const newErrors: Record<string, string> = { ...errors };

    if (!passwordChecker(text)) {
      newErrors.password = t("auth.passwordRule");
    } else {
      delete newErrors.password;
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
      newErrors.confirmPassword = t("auth.passwordsMismatch");
    } else {
      delete newErrors.confirmPassword;
    }
    setConfirmPassword(text);
    setErrors(newErrors);
  };

  /**
   * Validates the registration form fields and updates errors.
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameTrimmed = name.trim().replace(/\s+/g, " ");
    if (!nameTrimmed) {
      newErrors.name = t("auth.nameRequired");
    } else if (nameTrimmed.length < 3) {
      newErrors.name = t("auth.nameMin");
    } else if (!nameTrimmed.includes(" ")) {
      newErrors.name = t("auth.nameFull");
    }

    if (!email.trim()) {
      newErrors.email = t("auth.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t("auth.invalidEmail");
    }

    if (!password.trim()) {
      newErrors.password = t("auth.passwordRequired");
    } else if (!passwordChecker(password)) {
      newErrors.password = t("auth.passwordRule");
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
   * Submits the registration form after validation.
   */
  const handleRegister = async () => {
    if (!validate()) return;

    const success = await register({ name, email, password });
    if (success) {
      router.replace({
        pathname: "/auth-feedback",
        params: { mode: "accountCreated" },
      });
    }
  };

  const handleGoogle = async () => {
    const success = await signInWithGoogle();
    if (success) {
      router.replace("/students");
    }
  };

  const displayError = translateAuthError(apiError ?? googleError, t);

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-header-3 text-content">{t("auth.registerTitle")}</Text>

      <View className="w-full max-w-[342px] gap-4">
        <View className="gap-1">
          <Text className="text-default-2 text-muted">{t("auth.fullName")}</Text>
          <DefaultTextInput
            placeholder={t("auth.fullNamePlaceholder")}
            value={name}
            maxLength={100}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={errors.name ? "border-error" : "border-outline"}
          />
          {errors.name && (
            <Text className="text-default-3 text-error">{errors.name}</Text>
          )}
        </View>

        <View className="gap-1">
          <Text className="text-default-2 text-muted">{t("auth.email")}</Text>
          <DefaultTextInput
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            maxLength={254}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={
              errors.email ? "border-error" : "border-outline"
            }
          />
          {errors.email && (
            <Text className="text-default-3 text-error">{errors.email}</Text>
          )}
        </View>

        <View className="gap-1">
          <Text className="text-default-2 text-muted">{t("auth.password")}</Text>
          <PasswordInput
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            maxLength={20}
            onChangeText={handlePasswordChange}
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={
              errors.password ? "border-error" : "border-outline"
            }
          />
          {errors.password && (
            <Text className="text-default-3 text-error">{errors.password}</Text>
          )}
        </View>

        <View className="gap-1">
          <Text className="text-default-2 text-muted">{t("auth.confirmPassword")}</Text>
          <PasswordInput
            placeholder={t("auth.confirmPasswordPlaceholder")}
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

        {isGooglePending ? (
          <Text className="mt-3 text-default-3 text-extra">
            {t("auth.googlePendingRegister")}
          </Text>
        ) : displayError ? (
          <Text className="mt-3 text-default-3 text-error">{displayError}</Text>
        ) : null}
      </View>

      <View className="mt-7 w-full max-w-[342px] items-center gap-3">
        <DefaultButton
          label={loading ? t("auth.registering") : t("auth.register")}
          onPress={handleRegister}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
          disabled={
            loading ||
            !name.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
          }
        />

        <View className="w-full flex-row items-center gap-3">
          <View className="h-px flex-1 bg-outline" />
          <Text className="text-default-3 text-muted">{t("auth.or")}</Text>
          <View className="h-px flex-1 bg-outline" />
        </View>

        <DefaultButton
          label={googleLoading ? t("auth.connecting") : t("auth.registerGoogle")}
          icon={googleLoading ? undefined : <SvgXml xml={googleLogoXml} width={18} height={18} />}
          onPress={handleGoogle}
          sizeClass="w-full h-11"
          disabled={googleLoading}
          bgColorClass="bg-level1"
          hasShadow={false}
          isOutline
          outlineBorderClass="border-outline"
          textClassName="text-content"
        />
      </View>

      <View className="mt-7 items-center">
        <Pressable onPress={() => router.replace("/")}>
          <Text className="text-header-3">
            <Text className="text-muted">{t("auth.haveAccount")}</Text>
            <Text className="text-secondary">{t("auth.enterLink")}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
