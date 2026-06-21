import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Keyboard, TouchableWithoutFeedback, View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionGlobalProvider } from "@/features/sessions/contexts/session-global-context";
import { GlobalSessionWidget } from "@/features/sessions/components/global-session-widget";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

  if (!loaded && !error) {
    return null;
  }

  const stack = <Stack screenOptions={{ headerShown: false }} />;

  return (
    <SessionGlobalProvider>
      {Platform.OS !== "web" ? (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
              {stack}
              <GlobalSessionWidget />
            </View>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>      
      ) : (
        <View style={{ flex: 1 }}>
          {stack}
          <GlobalSessionWidget />
        </View>
      )}
    </SessionGlobalProvider>
  );
}