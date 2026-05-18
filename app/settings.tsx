import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function SettingsRoute() {
  const router = useRouter();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setIsLogoutModalVisible(false);
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />
      
      <View className="flex-1 px-8">
        <View className="mt-5 w-full">
          <PageHeader
            title="Configurações"
            subtitle="Gerencie suas preferências e conta"
          />
        </View>

        <Pressable
          onPress={() => setIsLogoutModalVisible(true)}
          style={{ borderColor: colors.error }}
          className="mt-8 w-full h-20 flex-row items-center rounded-2xl border bg-level2 p-4 active:opacity-80"
        >
          <View 
            style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
            className="h-11 w-11 items-center justify-center rounded-2xl mr-4"
          >
            <LogOut size={20} color={colors.error} />
          </View>

          <View className="flex-1 flex-col justify-center">
            <Text className="text-base font-medium text-error leading-5">
              Sair da conta
            </Text>
          </View>
        </Pressable>
      </View>

      <ConfirmationModal
        visible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={handleLogout}
        mode="logout"
      />
    </View>
  );
}