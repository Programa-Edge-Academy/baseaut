import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/upload-image";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

/** Profile and identity data shown on the account screen. */
export type AccountProfile = {
  id: string;
  nomeCompleto: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  /** Auth providers linked to the account (e.g. "email", "google"). */
  providers: string[];
  /** True when the account can change its password (email provider). */
  hasPassword: boolean;
  /** True when a Google identity is linked. */
  hasGoogle: boolean;
  /** True when Google is the only identity (cannot be unlinked). */
  googleOnly: boolean;
};

/** Result shape shared by the account update actions. */
export type AccountActionResult = {
  success: boolean;
  /** Auth error message (raw, translate before display) when success is false. */
  error?: string;
  /** Extra info for the UI, e.g. confirmation e-mail/SMS sent. */
  needsConfirmation?: boolean;
};

/**
 * Loads the signed-in user's profile plus linked auth identities and provides
 * the account-management actions: update name, e-mail, phone, password and
 * avatar, and link/unlink the Google identity.
 *
 * @remarks
 * E-mail changes send a confirmation link before taking effect in auth.
 * Unlinking identities requires "manual linking" enabled in the Supabase
 * project settings.
 */
export function useAccount() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setProfile(null);
        return;
      }

      const { data: row } = await supabase
        .from("profiles")
        .select("nome_completo, email, avatar_url, role")
        .eq("id", user.id)
        .single();

      const providers = (user.identities ?? []).map((i) => i.provider);
      const hasGoogle = providers.includes("google");
      const hasPassword = providers.includes("email");

      setProfile({
        id: user.id,
        nomeCompleto: row?.nome_completo ?? "",
        email: row?.email ?? user.email ?? null,
        avatarUrl: row?.avatar_url ?? null,
        role: row?.role ?? "monitor",
        providers,
        hasPassword,
        hasGoogle,
        googleOnly: hasGoogle && !hasPassword,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateName = async (name: string): Promise<AccountActionResult> => {
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!profile) return { success: false };

    const { error } = await supabase
      .from("profiles")
      .update({ nome_completo: cleanName })
      .eq("id", profile.id);
    if (error) return { success: false, error: error.message };

    await supabase.auth.updateUser({ data: { nome_completo: cleanName } });
    await loadProfile();
    return { success: true };
  };

  const updateEmail = async (email: string): Promise<AccountActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    if (error) return { success: false, error: error.message };
    return { success: true, needsConfirmation: true };
  };

  const updatePassword = async (password: string): Promise<AccountActionResult> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const updateAvatar = async (uri: string | null): Promise<AccountActionResult> => {
    if (!profile) return { success: false };

    let finalUrl: string | null = null;
    if (uri) {
      finalUrl = uri.startsWith("http")
        ? uri
        : await uploadImage("avatares", uri, "usuarios");
      if (!finalUrl) return { success: false, error: "upload failed" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: finalUrl })
      .eq("id", profile.id);
    if (error) return { success: false, error: error.message };
    await loadProfile();
    return { success: true };
  };

  const linkGoogle = async (): Promise<AccountActionResult> => {
    try {
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.linkIdentity({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return { success: true };
      }

      const redirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("OAuth indisponível");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return { success: false };

      await loadProfile();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message ?? String(err) };
    }
  };

  const unlinkGoogle = async (): Promise<AccountActionResult> => {
    const { data: userData } = await supabase.auth.getUser();
    const identity = userData?.user?.identities?.find((i) => i.provider === "google");
    if (!identity) return { success: false, error: "identity not found" };

    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) return { success: false, error: error.message };
    await loadProfile();
    return { success: true };
  };

  return {
    profile,
    isLoading,
    refresh: loadProfile,
    updateName,
    updateEmail,
    updatePassword,
    updateAvatar,
    linkGoogle,
    unlinkGoogle,
  };
}
