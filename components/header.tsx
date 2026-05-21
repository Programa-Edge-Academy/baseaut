import { baseautLogoXml } from "@/assets/baseaut-logo";
import { colors } from "@/assets/colors";
import { ArrowLeft, Settings, Users, X } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from "react-native-svg";
import { supabase } from "@/lib/supabase";

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
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (!error && data) {
            setRole(data.role);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar role do cabeçalho:", err);
      }
    }
    fetchUserRole();
  }, []);

  const showBack = ["back", "finish", "finishEngagement"].includes(variant);
  const showDefaultActions = variant === "default";
  const showFinishError = variant === "finish";
  const showFinishExtra = variant === "finishEngagement";

  const handleLogoPress = () => {
    if (pathname !== "/students") {
      router.replace("/students");
    }
  };

  return (
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
          </View>

          <View className="flex-1 flex-row justify-end items-center">
            {showDefaultActions && (
              <View className="flex-row items-center">
                <Pressable onPress={() => router.push("/settings")} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                  <Settings color={colors.muted} size={24} />
                </Pressable>
                
                {role === "coordenador" && (
                  <Pressable onPress={() => router.push("/team")} className="p-1 active:opacity-70" style={{ marginLeft: 20 }}>
                    <Users color={colors.muted} size={24} />
                  </Pressable>
                )}
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
  );
}