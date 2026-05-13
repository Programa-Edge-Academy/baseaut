import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-Bold": Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      if (url.includes("access_token") && url.includes("type=recovery")) {
        const extractParam = (str: string, param: string) => {
          const match = str.match(new RegExp(`[#?&]${param}=([^&]+)`));
          return match ? match[1] : null;
        };

        const access_token = extractParam(url, "access_token");
        const refresh_token = extractParam(url, "refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error) {
            router.replace("/reset-password");
          }
        }
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const sub = Linking.addEventListener("url", (e) => handleDeepLink(e.url));
    return () => {
      sub.remove();
    };
  }, [router]);

  if (!loaded && !error) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
