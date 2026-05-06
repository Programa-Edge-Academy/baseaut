import { ArrowLeft, Settings, User, X } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type HeaderProps = {
  variant?: "default" | "back" | "finish";
  onPressBack?: () => void;
  onPressFinish?: () => void;
  logoSource?: any;
};

export function Header({
  variant = "default",
  onPressBack,
  onPressFinish,
  logoSource,
}: HeaderProps) {
  return (
    <View className="w-full items-center bg-level1">
      <View className="w-full items-center justify-center bg-level2 p-4">

        <View className="w-full flex-row items-center justify-between mx-4">

          {/* LOGO */}
          <Image
            source={logoSource ?? require("../assets/images/baseaut-logo.svg")}
            className="h-10 w-32"
            resizeMode="contain"
          />

          {/* VARIANT: DEFAULT (icons) */}
          {variant === "default" && (
            <View className="flex-row items-center">
              <View className="ml-2 text-muted">
                <Settings size={24} color="currentColor" />
              </View>

              <View className="ml-2 text-muted">
                <User size={24} color="currentColor" />
              </View>
            </View>
          )}

          {/* VARIANT: BACK */}
          {variant === "back" && (
            <Pressable
              onPress={onPressBack}
              className="flex-row items-center gap-2 px-4 py-2 rounded-xl border-2 border-outline bg-level2"
            >
              <View className="text-muted">
                <ArrowLeft size={24} color="currentColor" />
              </View>

              <Text className="text-muted font-inter">
                Voltar
              </Text>
            </Pressable>
          )}

          {/* VARIANT: FINISH */}
          {variant === "finish" && (
            <>   
              <View />

              <Pressable
                onPress={onPressFinish}
                className="flex-row items-center gap-2 px-4 py-2 rounded-xl border-2 border-error bg-error/10"
              >
                <View className="text-error">
                  <X size={24} color="currentColor" />
                </View>

                <Text className="text-error font-inter">
                  Finalizar
                </Text>
              </Pressable>

              <Pressable
                onPress={onPressBack}
                className="flex-row items-center gap-2 px-4 py-2 rounded-xl border-2 border-outline bg-level2"
              >
                <View className="text-muted">
                  <ArrowLeft size={24} color="currentColor" />
                </View>

                <Text className="text-muted font-inter">
                  Voltar
                </Text>
              </Pressable>
            </>
          )}

        </View>

      </View>
    </View>
  );
}