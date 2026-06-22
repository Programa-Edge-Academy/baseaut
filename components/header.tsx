import { baseautLogoXml } from "@/assets/baseaut-logo";
import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useUserRole } from "@/lib/use-user-role";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "expo-router";
import { ArrowLeft, LogOut, Save, Users, X } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from "react-native-svg";

type HeaderProps = {
  variant?: "default" | "back" | "finish" | "finishEngagement" | "form";
  onPressBack?: () => void;
  onPressFinish?: () => void;
  onPressSave?: () => void;
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
  onPressSave,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useUserRole();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setIsLogoutModalVisible(false);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const showBack = ["back", "finish", "finishEngagement", "form"].includes(variant);
  const showDefaultActions = variant === "default";
  const showFinishError = variant === "finish";
  const showFinishExtra = variant === "finishEngagement";
  const showFormSave = variant === "form";

  const handleLogoPress = () => {
    if (pathname !== "/students") {
      router.replace("/students");
    }
  };

  return (
    <>
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View className="w-full items-center justify-center bg-level2 p-4">
        <View className="w-full flex-row items-center justify-between">

          <View className="flex-1 flex-row justify-start items-center">
            <Pressable onPress={handleLogoPress} className="active:opacity-80">
              <SvgXml xml={baseautLogoXml} width={76} height={34} />
            </Pressable>
          </View>

          <View className="flex-1 flex-row justify-center items-center">
            {showFinishError && (
              <Pressable
                onPress={onPressFinish}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-error bg-error/10 active:opacity-70"
              >
                <X color={colors.error} size={24} />
                <Text className="text-error text-default-1 ml-2">Finalizar</Text>
              </Pressable>
            )}

            {showFinishExtra && (
              <Pressable
                onPress={onPressFinish}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-extra bg-extra/10 active:opacity-70"
              >
                <X color={colors.extra} size={24} />
                <Text className="text-extra text-default-1 ml-2">Finalizar</Text>
              </Pressable>
            )}

            {showFormSave && (
              <Pressable
                onPress={onPressSave}
                className="flex-row items-center px-4 py-2.5 rounded-2xl bg-primary shadow-primaryShadow active:opacity-70"
              >
                <Save color="#FFFFFF" size={20} />
                <Text className="text-white text-default-1 ml-2">Salvar</Text>
              </Pressable>
            )}
          </View>

          <View className="flex-1 flex-row justify-end items-center">
            {showDefaultActions && (
              <View className="flex-row items-center px-3 py-1.5">
                {role === "coordenador" && (
                  <Pressable onPress={() => router.push("/team")} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                    <Users color={colors.muted} size={24} />
                  </Pressable>
                )}

                <Pressable onPress={() => setIsLogoutModalVisible(true)} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                  <LogOut color={colors.muted} size={24} />
                </Pressable>
              </View>
            )}

            {showBack && (
              <Pressable
                onPress={onPressBack}
                className="flex-row items-center px-4 py-2 rounded-xl border-2 border-outline bg-level2 active:opacity-70"
              >
                <ArrowLeft color={colors.muted} size={24} />
                <Text className="text-muted text-default-1 ml-2">Voltar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>

    <ConfirmationModal
      visible={isLogoutModalVisible}
      onClose={() => setIsLogoutModalVisible(false)}
      onConfirm={handleLogout}
      mode="logout"
    />
    </>
  );
}