import { colors } from "@/assets/colors";
import { createSessionFromUrl } from "@/features/auth/hooks/use-google-auth";
import { verifyAccountStatus } from "@/features/auth/hooks/use-login";
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
 * account still awaits a coordinator, or back to login on failure.
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
          await createSessionFromUrl(callbackUrl);
          ({
            data: { session },
          } = await supabase.auth.getSession());
        }

        if (!session) {
          router.replace("/");
          return;
        }

        const status = await verifyAccountStatus(session.user.id);
        if (status === "pending") {
          router.replace({
            pathname: "/auth-feedback",
            params: { mode: "pendingApproval" },
          });
        } else if (status === "blocked") {
          router.replace("/");
        } else {
          router.replace("/students");
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
