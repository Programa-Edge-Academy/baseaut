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
          {/* FIX: SVG won't work in Image → use PNG or SVG component */}
          <Image
            source={logoSource ?? require("../assets/images/baseaut-logo.png")}
            className="h-10 w-32"
            resizeMode="contain"
          />

          {/* DEFAULT */}
          {variant === "default" && (
            <View className="flex-row items-center">
              <Settings className="color-muted" size={24} style={{ marginLeft: 8 }} />
              <User className="color-muted" size={24} style={{ marginLeft: 8 }} />
            </View>
          )}

          {/* BACK */}
          {variant === "back" && (
            <Pressable
              onPress={onPressBack}
              className="flex-row items-center px-4 py-2 rounded-xl border-2 border-outline bg-level2"
            >
              <ArrowLeft className="color-muted" size={24} />

              <Text className="text-muted font-inter ml-2">
                Voltar
              </Text>
            </Pressable>
          )}

          {/* FINISH */}
          {variant === "finish" && (
            <>
              <View />

              <Pressable
                onPress={onPressFinish}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-error bg-error/10"
              >
                <X className="color-error" size={24} />

                <Text className="text-error font-inter ml-2">
                  Finalizar
                </Text>
              </Pressable>

              <Pressable
                onPress={onPressBack}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-outline bg-level2"
              >
                <ArrowLeft className="color-muted" size={24} />

                <Text className="text-muted font-inter ml-2">
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