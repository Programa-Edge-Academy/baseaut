import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { passwordChecker } from "@/features/auth/hooks/password-checker";
import { useGoogleAuth } from "@/features/auth/hooks/use-google-auth";
import { useRegister } from "@/features/auth/hooks/use-register";
import { translateAuthError } from "@/features/auth/utils/translate-auth-error";
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
      newErrors.password =
        "A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial";
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
      newErrors.confirmPassword = "As senhas não coincidem";
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
      newErrors.name = "Nome é obrigatório";
    } else if (nameTrimmed.length < 3) {
      newErrors.name = "O nome deve ter no mínimo 3 caracteres";
    } else if (!nameTrimmed.includes(" ")) {
      newErrors.name = "Informe pelo menos nome e sobrenome";
    }

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email inválido";
    }

    if (!password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (!passwordChecker(password)) {
      newErrors.password =
        "A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial";
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

  const displayError = translateAuthError(apiError ?? googleError);

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <Text className="mb-5 text-header-3 text-content">Crie sua conta</Text>

      <View className="w-full max-w-[342px] gap-4">
        <View className="gap-1">
          <Text className="text-default-2 text-muted">Nome completo</Text>
          <DefaultTextInput
            placeholder="Digite seu nome completo"
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
          <Text className="text-default-2 text-muted">E-mail</Text>
          <DefaultTextInput
            placeholder="Seu e-mail"
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
          <Text className="text-default-2 text-muted">Senha</Text>
          <PasswordInput
            placeholder="Sua senha"
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
          <Text className="text-default-2 text-muted">Confirmar senha</Text>
          <PasswordInput
            placeholder="Confirme sua senha"
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
            Sua conta Google foi cadastrada e aguarda aprovação.
          </Text>
        ) : displayError ? (
          <Text className="mt-3 text-default-3 text-error">{displayError}</Text>
        ) : null}
      </View>

      <View className="mt-7 w-full max-w-[342px] items-center gap-3">
        <DefaultButton
          label={loading ? "Cadastrando..." : "Cadastrar-se"}
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
          <Text className="text-default-3 text-muted">ou</Text>
          <View className="h-px flex-1 bg-outline" />
        </View>

        <DefaultButton
          label={googleLoading ? "Conectando..." : "Cadastrar com Google"}
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
            <Text className="text-muted">Já tem conta? </Text>
            <Text className="text-secondary">Entre</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
