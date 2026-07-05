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
import { View, Platform, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { SessionGlobalProvider } from "@/features/sessions/contexts/session-global-context";
import { GlobalToastProvider } from "@/components/global-toast";
import { GlobalSessionWidget } from "@/features/sessions/components/global-session-widget";
import { ThemeProvider } from "@/features/settings/contexts/theme-context";
import { I18nProvider } from "@/features/settings/contexts/i18n-context";
import { TutorialProvider } from "@/features/tutorial/contexts/tutorial-context";
import { SessionSimulationProvider } from "@/features/tutorial/contexts/session-simulation-controller";
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
 *
 * The rendered tree is keyed on the system font scale and display scale:
 * changing either while the app is backgrounded only partially re-renders the
 * UI (stale measurements survive until a full restart), so the key forces a
 * clean remount when the user returns. Providers sit above the key, so global
 * session state survives the remount.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-Bold": Inter_700Bold,
  });
  const { fontScale, scale } = useWindowDimensions();

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
      <ThemeProvider>
      <I18nProvider>
      <TutorialProvider>
      <GlobalToastProvider>
      <SessionGlobalProvider>
      <SessionSimulationProvider>
        {Platform.OS !== "web" ? (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View key={`metrics-${fontScale}-${scale}`} style={{ flex: 1 }}>
              {stack}
              <GlobalSessionWidget />
            </View>
          </GestureHandlerRootView>
        ) : (
          <View key={`metrics-${fontScale}-${scale}`} style={{ flex: 1 }}>
            {stack}
            <GlobalSessionWidget />
          </View>
        )}
      </SessionSimulationProvider>
      </SessionGlobalProvider>
      </GlobalToastProvider>
      </TutorialProvider>
      </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}