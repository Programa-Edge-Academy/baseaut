import { Stack } from "expo-router";
import { useEffect } from "react";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return <Stack />;
}
