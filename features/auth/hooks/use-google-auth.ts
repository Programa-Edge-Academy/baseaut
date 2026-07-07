import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";
import { verifyAccountStatus } from "./use-login";

WebBrowser.maybeCompleteAuthSession();

/**
 * Extracts the Supabase session tokens from an OAuth callback URL and creates
 * the local session. Handles both the implicit flow (tokens in the URL
 * fragment) and the PKCE flow (`code` query parameter).
 *
 * @remarks
 * Also used by the `auth-callback` route for the case where the OAuth redirect
 * re-opens the app via the `baseaut://` deep link instead of being caught by
 * the in-app browser session.
 */
export async function createSessionFromUrl(url: string): Promise<boolean> {
  const fragment = url.split("#")[1];
  if (fragment) {
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return !error;
    }
  }

  const query = url.split("?")[1]?.split("#")[0];
  if (query) {
    const params = new URLSearchParams(query);
    const code = params.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return !error;
    }
  }
  return false;
}

/**
 * Provides Google sign-in/sign-up backed by Supabase OAuth.
 *
 * On web it redirects the page to Google and back (session picked up on
 * return). On native it opens an in-app auth browser session and builds the
 * session from the callback URL, which returns to the app via the `baseaut://`
 * scheme — so it needs no native module, no Android SHA-1 client and no owned
 * domain. New Google accounts fall under the same approval flow as e-mail
 * registrations (profile created as "pendente").
 *
 * @remarks
 * Requires the Google provider enabled in the Supabase dashboard (Web client
 * id/secret) and `baseaut://**` added under Authentication → URL Configuration →
 * Redirect URLs.
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const signInWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setIsPendingApproval(false);

    try {
      if (Platform.OS === "web") {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (oauthError) throw oauthError;
        return false;
      }

      const redirectTo = Linking.createURL("auth-callback");
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error("OAuth indisponível");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) return false;

      const created = await createSessionFromUrl(result.url);
      if (!created) throw new Error("Não foi possível concluir o login com o Google.");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return false;

      const status = await verifyAccountStatus(userData.user.id);
      if (status === "pending") {
        setIsPendingApproval(true);
        return false;
      }
      if (status === "blocked") {
        throw new Error("Invalid login credentials");
      }
      return true;
    } catch (err: any) {
      setError(err.message ?? String(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error, isPendingApproval };
}
