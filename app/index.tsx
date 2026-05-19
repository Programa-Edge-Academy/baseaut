import { LoginScreen } from "@/features/auth/screens/login-screen";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { colors } from "@/assets/colors";

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status_conta, role")
          .eq("id", session.user.id)
          .single();

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