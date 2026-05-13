import { baseautLogoXml } from "@/assets/baseaut-logo";
import { colors } from "@/assets/colors";
import { ArrowLeft, Settings, User, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from "react-native-svg";

type HeaderProps = {
  variant?: "default" | "back" | "finish" | "finishEngagement";
  onPressBack?: () => void;
  onPressFinish?: () => void;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.level2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export function Header({
  variant = "default",
  onPressBack,
  onPressFinish,
}: HeaderProps) {
  const showBack = ["back", "finish", "finishEngagement"].includes(variant);
  const showDefaultActions = variant === "default";
  const showFinishError = variant === "finish";
  const showFinishExtra = variant === "finishEngagement";

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View className="w-full items-center justify-center bg-level2 p-4">
        <View className="w-full flex-row items-center justify-between">
          
          <View className="flex-1 flex-row justify-start items-center">
            <SvgXml xml={baseautLogoXml} width={76} height={34} />
          </View>

          <View className="flex-1 flex-row justify-center items-center">

            {showFinishError && (
              <Pressable
                onPress={onPressFinish}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-error bg-error/10"
              >
                <X color={colors.error} size={24} />
                <Text className="text-error text-default-1 ml-2">Finalizar</Text>
              </Pressable>
            )}

            {showFinishExtra && (
              <Pressable
                onPress={onPressFinish}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-extra bg-extra/10"
              >
                <X color={colors.extra} size={24} />
                <Text className="text-extra text-default-1 ml-2">Finalizar</Text>
              </Pressable>
            )}
          </View>

          <View className="flex-1 flex-row justify-end items-center">
            {showDefaultActions && (
              <View className="flex-row items-center">
                <Settings color={colors.muted} size={24} style={{ marginLeft: 20 }} />
                <User color={colors.muted} size={24} style={{ marginLeft: 20 }} />
              </View>
            )}

            {showBack && (
              <Pressable
                onPress={onPressBack}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-outline bg-level2"
              >
                <ArrowLeft color={colors.muted} size={24} />
                <Text className="text-muted text-default-1 ml-2">Voltar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}