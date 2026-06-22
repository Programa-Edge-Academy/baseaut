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

  // Animações de transição desativadas globalmente: evita o "flash branco"
  // ao trocar de tela no nativo, deixando-o instantâneo como na web. O fundo
  // escuro (level1) garante que nenhum frame branco apareça durante a troca.
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
    // initialWindowMetrics fornece os safe-area insets de forma SÍNCRONA já no
    // primeiro render. Sem isso, os insets começam em 0 e só são medidos depois,
    // fazendo o conteúdo "pular" para a posição correta (o flicker percebido ao
    // trocar de tela, agora que não há animação mascarando o primeiro frame).
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