import { colors } from "@/assets/colors";
import { createSessionFromUrl } from "@/features/auth/hooks/use-google-auth";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Deep-link landing route for the Google OAuth redirect (`baseaut://auth-callback`).
 *
 * @remarks
 * On native the sign-in flow normally captures the redirect inside the in-app
 * browser session ({@link useGoogleAuth}). Some browsers/OS versions instead
 * hand the `baseaut://` scheme straight to the app, re-opening it on this route.
 * Without a matching route Expo Router would show "Unmatched route", so this
 * screen completes the login from the callback URL and forwards the user to the
 * right place: the app when approved, the pending-approval feedback when the
 * account still awaits a coordinator, or back to login otherwise.
 *
 * Navigation is never awaited on `signOut()`: pending/blocked accounts are
 * signed out in the background so the redirect happens immediately instead of
 * hanging on the spinner while the revoke request is in flight.
 */
export default function AuthCallback() {
  const url = Linking.useURL();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const finish = async () => {
      const callbackUrl = url ?? (await Linking.getInitialURL());
      if (!callbackUrl) return;
      handled.current = true;

      try {
        // Reuse an existing session if the sign-in flow already created one;
        // otherwise build it from the redirect URL (implicit or PKCE flow).
        let {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
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

        if (!session) {
          router.replace("/");
          return;
        }

        // Read the approval status directly so navigation does not block on the
        // sign-out network call. `maybeSingle` avoids throwing when the profile
        // row was not created yet for a brand-new account.
        const { data: profile } = await supabase
          .from("profiles")
          .select("status_conta, role")
          .eq("id", session.user.id)
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

        // Not yet approved: drop the session in the background and forward to the
        // matching screen without waiting for the revoke request to resolve.
        void supabase.auth.signOut();
        if (blocked) {
          router.replace("/");
        } else {
          router.replace({
            pathname: "/auth-feedback",
            params: { mode: "pendingApproval" },
          });
        }
      } catch {
        router.replace("/");
      }
    };

    finish();
  }, [url]);

  return (
    <View className="flex-1 items-center justify-center bg-level1">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
