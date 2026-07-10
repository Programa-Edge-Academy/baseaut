import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useGoogleAuth } from "@/features/auth/hooks/use-google-auth";
import { useLogin } from "@/features/auth/hooks/use-login";
import { translateAuthError } from "@/features/auth/utils/translate-auth-error";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { googleLogoXml } from "@/assets/google-logo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

/**
 * Login form UI with validation and submit handling. Signs in with e-mail and
 * password, and also offers Google sign-in.
 */
export function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error: apiError, isPendingApproval } = useLogin();
  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
    isPendingApproval: isGooglePending,
  } = useGoogleAuth();
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  /**
   * Validates the login form fields and updates local errors.
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      newErrors.identifier = t("auth.invalidEmail");
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submits the login form after validation.
   */
  const handleSubmit = async () => {
    if (!validate()) return;
    const success = await login(identifier, password);
    if (success) {
      router.replace("/students");
    }
  };

  const handleGoogle = async () => {
    const success = await signInWithGoogle();
    if (success) {
      router.replace("/students");
    }
  };

  const displayApiError = translateAuthError(apiError ?? googleError);
  const showPending = isPendingApproval || isGooglePending;
  const isButtonDisabled = !identifier.trim() || !password.trim() || loading;

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-header-3 text-content">{t("auth.loginTitle")}</Text>

      <View className="w-full max-w-[342px] gap-4">
        <View className="w-full gap-1">
          <Text className="text-default-2 text-muted">{t("auth.email")}</Text>
          <DefaultTextInput
            placeholder={t("auth.emailPlaceholder")}
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={
              localErrors.identifier ? "border-error" : "border-outline"
            }
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (localErrors.identifier) setLocalErrors({});
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={254}
          />
          {localErrors.identifier ? (
            <Text className="text-default-3 text-error">
              {localErrors.identifier}
            </Text>
          ) : null}
        </View>
        <View className="w-full gap-1">
          <Text className="text-default-2 text-muted">{t("auth.password")}</Text>
          <PasswordInput
            placeholder="Sua senha"
            maxLength={20}
            className="h-11 w-full rounded-[15px]"
            outLineBorderClass={
              localErrors.password ? "border-error" : "border-outline"
            }
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (localErrors.password) setLocalErrors({});
            }}
          />
          {localErrors.password ? (
            <Text className="text-default-3 text-error">
              {localErrors.password}
            </Text>
          ) : null}
        </View>
      </View>

      {showPending ? (
        <Text className="mt-3 text-default-3 text-extra text-center">
          {t("auth.pendingApproval")}
        </Text>
      ) : displayApiError ? (
        <Text className="mt-3 text-default-3 text-error text-center">
          {displayApiError}
        </Text>
      ) : null}

      <View className="mt-7 w-full max-w-[342px] items-center gap-3">
        <DefaultButton
          label={loading ? `${t("auth.enter")}...` : t("auth.enter")}
          onPress={handleSubmit}
          sizeClass="w-full h-11"
          disabled={isButtonDisabled}
          bgColorClass={isButtonDisabled ? "bg-muted" : "bg-primary"}
          shadowClass={isButtonDisabled ? "shadow-none" : "shadow-primaryShadow"}
          textClassName="text-content"
        />

        <View className="w-full flex-row items-center gap-3">
          <View className="h-px flex-1 bg-outline" />
          <Text className="text-default-3 text-muted">{t("auth.or")}</Text>
          <View className="h-px flex-1 bg-outline" />
        </View>

        <DefaultButton
          label={googleLoading ? "..." : t("auth.google")}
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

      <View className="mt-7 items-center gap-3">
        <View className="flex-row items-center">
          <Text className="text-muted text-header-3">{t("auth.noAccount")}</Text>
          <Pressable onPress={() => router.push("/register" as never)}>
            <Text className="text-secondary text-header-3">{t("auth.signUp")}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push("/reset-password-code" as never)}>
          <Text className="text-header-3 text-primary">
            {t("auth.forgotPassword")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
