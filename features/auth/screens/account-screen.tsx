import { withOpacity } from "@/components/color-opacity";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Toast } from "@/components/toast";
import { PasswordInput } from "@/features/auth/components/password-input";
import { passwordChecker } from "@/features/auth/hooks/password-checker";
import { useAccount } from "@/features/auth/hooks/use-account";
import { translateAuthError } from "@/features/auth/utils/translate-auth-error";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { supabase } from "@/lib/supabase";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import { useRouter } from "expo-router";
import { Camera, Link2, LogOut, Trash2, Unlink2, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

/** Password rule message reused for inline validation. */
const INVALID_PASSWORD_MSG =
  "A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial";

/** Section container with a title, following the app's card style. */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="w-full rounded-2xl border border-outline bg-level2 p-5 gap-4">
      <Text className="text-header-3 text-content">{title}</Text>
      {children}
    </View>
  );
}

/**
 * Account screen: profile photo (tap the avatar or the button to change it),
 * personal data (name, e-mail), password change, Google link/unlink and logout.
 * Editable fields are validated inline following the same rules used by the
 * registration and password-reset screens. Which fields are editable depends on
 * how the account was registered — Google-only accounts cannot change e-mail or
 * password.
 */
export function AccountScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useI18n();
  const {
    profile,
    isLoading,
    updateName,
    updateEmail,
    updatePassword,
    updateAvatar,
    linkGoogle,
    unlinkGoogle,
  } = useAccount();
  const keyboardPadding = useKeyboardPadding();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    mode: "success" | "error";
    title: string;
    description?: string;
  }>({ visible: false, mode: "success", title: "" });

  useEffect(() => {
    if (profile) {
      setName(profile.nomeCompleto);
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const showToast = (mode: "success" | "error", title: string, description?: string) =>
    setToast({ visible: true, mode, title, description });

  const showResult = (
    result: { success: boolean; error?: string; needsConfirmation?: boolean },
    successTitle: string,
    confirmationDescription?: string,
  ) => {
    if (result.success) {
      showToast(
        "success",
        successTitle,
        result.needsConfirmation ? confirmationDescription : undefined,
      );
    } else {
      showToast("error", "Não foi possível salvar", translateAuthError(result.error) ?? undefined);
    }
    return result.success;
  };

  const handlePhotoPress = async () => {
    const ImagePicker = require("expo-image-picker");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSaving("avatar");
      const res = await updateAvatar(result.assets[0].uri);
      setSaving(null);
      showResult(res, "Foto atualizada!");
    }
  };

  const handleRemovePhoto = async () => {
    setSaving("avatar");
    const res = await updateAvatar(null);
    setSaving(null);
    showResult(res, "Foto removida.");
  };

  const handleSaveName = async () => {
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!cleanName) {
      setErrors((p) => ({ ...p, name: "Nome é obrigatório" }));
      return;
    }
    if (cleanName.length < 3) {
      setErrors((p) => ({ ...p, name: "O nome deve ter no mínimo 3 caracteres" }));
      return;
    }
    if (!cleanName.includes(" ")) {
      setErrors((p) => ({ ...p, name: "Informe pelo menos nome e sobrenome" }));
      return;
    }
    setSaving("name");
    const res = await updateName(cleanName);
    setSaving(null);
    showResult(res, "Nome atualizado!");
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) {
      setErrors((p) => ({ ...p, email: "Email é obrigatório" }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors((p) => ({ ...p, email: "Email inválido" }));
      return;
    }
    setSaving("email");
    const res = await updateEmail(email);
    setSaving(null);
    showResult(
      res,
      "Confirmação enviada!",
      "Enviamos um link de confirmação para o novo e-mail. A alteração vale após a confirmação.",
    );
  };

  const handleSavePassword = async () => {
    const newErrors: Record<string, string> = {};
    if (!password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (!passwordChecker(password)) {
      newErrors.password = INVALID_PASSWORD_MSG;
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors((p) => ({ ...p, ...newErrors }));
      return;
    }
    setSaving("password");
    const res = await updatePassword(password);
    setSaving(null);
    if (showResult(res, "Senha alterada!")) {
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleGoogle = async () => {
    setSaving("google");
    const res = profile?.hasGoogle ? await unlinkGoogle() : await linkGoogle();
    setSaving(null);
    showResult(res, profile?.hasGoogle ? "Conta Google desvinculada." : "Conta Google vinculada!");
  };

  const handleLogout = async () => {
    setIsLogoutModalVisible(false);
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (isLoading || !profile) {
    return (
      <View className="flex-1 bg-level1">
        <Header variant="back" onPressBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const emailEditable = !profile.googleOnly;

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView
        className="flex-1 px-8"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + keyboardPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-5 w-full">
          <PageHeader
            title={t("account.title")}
            subtitle={t("account.subtitle")}
          />
        </View>

        <View className="mt-6 gap-5">
          <SectionCard title={t("account.photo")}>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={handlePhotoPress}
                disabled={saving === "avatar"}
                className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-outline bg-level1 active:opacity-70"
              >
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <User size={32} color={colors.muted} />
                )}
                <View
                  className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-tl-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Camera size={13} color="#FFFFFF" />
                </View>
              </Pressable>

              <View className="flex-1 gap-2">
                <Pressable
                  onPress={handlePhotoPress}
                  disabled={saving === "avatar"}
                  className="flex-row items-center justify-center gap-2 rounded-xl border border-outline bg-level1 py-2.5 active:opacity-70"
                >
                  <Camera size={16} color={colors.muted} />
                  <Text className="text-default-2 text-content">
                    {saving === "avatar" ? `${t("common.save")}...` : t("account.changePhoto")}
                  </Text>
                </Pressable>
                {profile.avatarUrl && (
                  <Pressable
                    onPress={handleRemovePhoto}
                    disabled={saving === "avatar"}
                    className="flex-row items-center justify-center gap-2 rounded-xl border py-2.5 active:opacity-70"
                    style={{
                      borderColor: colors.error,
                      backgroundColor: withOpacity(colors.error, 0.1),
                    }}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text className="text-default-2 text-error">{t("account.removePhoto")}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </SectionCard>

          <SectionCard title={t("account.personalData")}>
            <View className="gap-1">
              <Text className="text-default-2 text-muted">{t("account.name")}</Text>
              <DefaultTextInput
                value={name}
                maxLength={100}
                onChangeText={(text) => {
                  setName(text);
                  clearError("name");
                }}
                className="h-11 w-full rounded-[15px]"
                outLineBorderClass={errors.name ? "border-error" : "border-outline"}
              />
              {errors.name && (
                <Text className="text-default-3 text-error">{errors.name}</Text>
              )}
              {name.trim() !== profile.nomeCompleto && (
                <DefaultButton
                  label={saving === "name" ? `${t("common.save")}...` : t("account.saveName")}
                  onPress={handleSaveName}
                  sizeClass="w-full h-10"
                  disabled={saving === "name"}
                />
              )}
            </View>

            <View className="gap-1">
              <Text className="text-default-2 text-muted">{t("account.email")}</Text>
              <DefaultTextInput
                value={email}
                maxLength={254}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError("email");
                }}
                editable={emailEditable}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`h-11 w-full rounded-[15px] ${emailEditable ? "" : "opacity-60"}`}
                outLineBorderClass={errors.email ? "border-error" : "border-outline"}
              />
              {errors.email && (
                <Text className="text-default-3 text-error">{errors.email}</Text>
              )}
              {!emailEditable && (
                <Text className="text-default-3 text-muted">
                  {t("account.emailManagedByGoogle")}
                </Text>
              )}
              {emailEditable && email.trim().toLowerCase() !== (profile.email ?? "") && (
                <DefaultButton
                  label={saving === "email" ? `${t("common.save")}...` : t("account.saveEmail")}
                  onPress={handleSaveEmail}
                  sizeClass="w-full h-10"
                  disabled={saving === "email"}
                />
              )}
            </View>
          </SectionCard>

          {profile.hasPassword && (
            <SectionCard title={t("account.changePassword")}>
              <View className="gap-1">
                <Text className="text-default-2 text-muted">{t("account.newPassword")}</Text>
                <PasswordInput
                  value={password}
                  maxLength={20}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError("password");
                  }}
                  placeholder="Nova senha"
                  className="h-11 w-full rounded-[15px]"
                  outLineBorderClass={errors.password ? "border-error" : "border-outline"}
                />
                {errors.password && (
                  <Text className="text-default-3 text-error">{errors.password}</Text>
                )}
              </View>
              <View className="gap-1">
                <Text className="text-default-2 text-muted">{t("account.confirmNewPassword")}</Text>
                <PasswordInput
                  value={confirmPassword}
                  maxLength={20}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError("confirmPassword");
                  }}
                  placeholder="Confirme a nova senha"
                  className="h-11 w-full rounded-[15px]"
                  outLineBorderClass={errors.confirmPassword ? "border-error" : "border-outline"}
                />
                {errors.confirmPassword && (
                  <Text className="text-default-3 text-error">{errors.confirmPassword}</Text>
                )}
              </View>
              <DefaultButton
                label={saving === "password" ? `${t("common.save")}...` : t("account.changePassword")}
                onPress={handleSavePassword}
                sizeClass="w-full h-10"
                disabled={saving === "password" || !password || !confirmPassword}
              />
            </SectionCard>
          )}

          <SectionCard title={t("account.google")}>
            <Text className="text-default-2 text-muted">
              {profile.hasGoogle
                ? t("account.googleLinked")
                : t("account.googleUnlinkedHint")}
            </Text>
            {profile.googleOnly ? (
              <Text className="text-default-3 text-muted">
                {t("account.googleOnly")}
              </Text>
            ) : (
              <Pressable
                onPress={handleGoogle}
                disabled={saving === "google"}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-outline bg-level1 py-2.5 active:opacity-70"
              >
                {profile.hasGoogle ? (
                  <Unlink2 size={16} color={colors.muted} />
                ) : (
                  <Link2 size={16} color={colors.muted} />
                )}
                <Text className="text-default-2 text-content">
                  {saving === "google"
                    ? `${t("common.loading")}`
                    : profile.hasGoogle
                      ? t("account.unlinkGoogle")
                      : t("account.linkGoogle")}
                </Text>
              </Pressable>
            )}
          </SectionCard>

          <Pressable
            onPress={() => setIsLogoutModalVisible(true)}
            style={{ borderColor: colors.error }}
            className="w-full h-20 flex-row items-center rounded-2xl border bg-level2 p-4 active:opacity-80"
          >
            <View
              style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
              className="mr-4 h-11 w-11 items-center justify-center rounded-2xl"
            >
              <LogOut size={20} color={colors.error} />
            </View>
            <View className="flex-1 flex-col justify-center">
              <Text className="text-default-1 text-error">{t("account.logout")}</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
        mode="logout"
      />

      <Toast
        visible={toast.visible}
        mode={toast.mode}
        title={toast.title}
        description={toast.description}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}
