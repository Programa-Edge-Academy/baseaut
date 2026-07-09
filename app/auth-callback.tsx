import { colors } from "@/assets/colors";
import { createSessionFromUrl } from "@/features/auth/hooks/use-google-auth";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

/** How long to wait for the deep link before resolving from the session alone. */
const RESOLVE_TIMEOUT_MS = 5000;

/**
 * Reads the account approval status and forwards accordingly: the app when
 * approved, the pending-approval feedback when it still awaits a coordinator, or
 * back to login when blocked. The session is dropped in the background for
 * non-approved accounts so navigation is immediate.
 */
async function routeByApproval(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("status_conta, role")
    .eq("id", userId)
    .maybeSingle();

  const approved =
    profile?.role === "coordenador" || profile?.status_conta === "ativa";
  if (approved) {
    router.replace("/students");
    return;
  }

  const blocked =
    profile?.status_conta === "bloqueada" ||
    profile?.status_conta === "rejeitada";

  void supabase.auth.signOut();
  if (blocked) {
    router.replace("/");
  } else {
    router.replace({
      pathname: "/auth-feedback",
      params: { mode: "pendingApproval" },
    });
  }
}

/**
 * Deep-link landing route for the Google OAuth redirect (`baseaut://auth-callback`).
 *
 * @remarks
 * On native the sign-in flow normally captures the redirect inside the in-app
 * browser session ({@link useGoogleAuth}). Some browsers/OS versions instead
 * hand the `baseaut://` scheme straight to the app, re-opening it on this route.
 * This screen completes the login from the callback URL and forwards the user to
 * the right place. A password-recovery link (`type=recovery`) that lands here is
 * forwarded to `/reset-password` instead. A timeout guarantees the spinner never
 * hangs when the deep link fails to arrive — an un-approved account is resolved
 * from whatever session already exists.
 */
export default function AuthCallback() {
  const url = Linking.useURL();
  const handled = useRef(false);

  useEffect(() => {
    const resolve = async () => {
      if (handled.current) return;

      const callbackUrl = url ?? (await Linking.getInitialURL());

      // Reuse an existing session if the sign-in flow already created one;
      // otherwise build it from the redirect URL (implicit or PKCE flow).
      let {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session && callbackUrl) {
        try {
          await createSessionFromUrl(callbackUrl);
        } catch {
          // The code may have already been consumed by the browser session;
          // fall back to whatever session is now stored.
        }
        ({
          data: { session },
        } = await supabase.auth.getSession());
      }

      // Nothing actionable yet: keep waiting for the deep link to arrive.
      if (!session && !callbackUrl) return;

      handled.current = true;

      // A recovery link resolves on the reset screen, regardless of approval.
      if (callbackUrl?.includes("type=recovery")) {
        router.replace("/reset-password");
        return;
      }

      if (!session) {
        router.replace("/");
        return;
      }

      await routeByApproval(session.user.id);
    };

    resolve();
  }, [url]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (handled.current) return;
      handled.current = true;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await routeByApproval(session.user.id);
      } else {
        router.replace("/");
      }
    }, RESOLVE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-level1">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
