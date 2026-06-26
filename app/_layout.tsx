import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import { colors } from "@/assets/colors";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Keyboard, TouchableWithoutFeedback, View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { SessionGlobalProvider } from "@/features/sessions/contexts/session-global-context";
import { GlobalToastProvider } from "@/components/global-toast";
import { GlobalSessionWidget } from "@/features/sessions/components/global-session-widget";
import "./global.css";

SplashScreen.preventAutoHideAsync();

/**
 * Root layout for the app. Loads the Inter fonts, holds the splash screen until
 * they resolve, and wraps the navigation stack with the safe-area, global toast,
 * and global session providers plus the floating session widget.
 *
 * @remarks
 * Screen transition animations are disabled globally to avoid a white flash when
 * switching screens on native (matching the instant web behaviour); the dark
 * `level1` background ensures no white frame appears mid-transition.
 * {@link initialWindowMetrics} is passed to the provider so safe-area insets are
 * available synchronously on the first render, preventing the content from
 * jumping once insets are measured.
 */
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

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor: colors.level1 },
      }}
    />
  );

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GlobalToastProvider>
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
      </GlobalToastProvider>
    </SafeAreaProvider>
  );
}