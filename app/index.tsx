import { colors } from "@/assets/colors";
import { LoginScreen } from "@/features/auth/screens/login-screen";
import { getCurrentUser } from "@/lib/offline/auth";
import { isOnline } from "@/lib/offline/require-online";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Entry route and auth gate. Checks for an existing session, signs out pending
 * non-coordinator users, and redirects authenticated users to `/students`;
 * otherwise renders the login screen.
 */
export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Offline the saved login is enough to get in; the approval check below
      // needs the network and runs on the next online start.
      const user = await getCurrentUser();

      if (user) {
        const { data: profile } = (await isOnline())
          ? await supabase
              .from("profiles")
              .select("status_conta, role")
              .eq("id", user.id)
              .single()
          : { data: null };

        if (profile && profile.role !== "coordenador" && profile.status_conta === "pendente") {
          await supabase.auth.signOut();
        } else {
          router.replace("/students"); 
          return; 
        }
      }
      
      setIsChecking(false);
    };

    checkSession();
  }, [router]);

  if (isChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-level1">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <LoginScreen />;
}
