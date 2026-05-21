import { BarChart3, Dumbbell, Users } from "lucide-react-native";
import React from "react";
import { colors } from "@/assets/colors";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const isActivityActive = (pathname === "/exercises" || pathname === "/circuits");
  const isStartActive = pathname === "/students";
  const isAnalysisActive = (pathname === "/analysis" || pathname === "/reports");

  const handleNavigate = (route: "/exercises" | "/students" | "/analysis") => {
    if (pathname !== route) {
      router.replace(route as any);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="w-full bg-level2">
      <View className="w-full items-center justify-center bg-level2 p-4">
        <View className="w-full flex-row">
          <Pressable
            onPress={() => handleNavigate("/exercises")}
            className="flex-1 items-center justify-center gap-1"
          >
            <View>
              <Dumbbell 
                size={28} 
                color={isActivityActive ? colors.primary : colors.muted} 
              />
            </View>

            <Text
              className={`text-default-1 ${
                isActivityActive ? "text-primary" : "text-muted"
              }`}
            >
              Atividades
            </Text>

            {isActivityActive && (
              <View className="w-1/2 h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

          <Pressable
            onPress={() => handleNavigate("/students")}
            className="flex-1 items-center justify-center gap-1"
          >
            <View>
              <Users 
                size={28} 
                color={isStartActive ? colors.primary : colors.muted} 
              />
            </View>

            <Text
              className={`text-default-1 ${
                isStartActive ? "text-primary" : "text-muted"
              }`}
            >
              Início
            </Text>

            {isStartActive && (
              <View className="w-1/2 h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

          <Pressable
            onPress={() => handleNavigate("/analysis")}
            className="flex-1 items-center justify-center gap-1"
          >
            <View>
              <BarChart3 
                size={28} 
                color={isAnalysisActive ? colors.primary : colors.muted} 
              />
            </View>

            <Text
              className={`text-default-1 ${
                isAnalysisActive ? "text-primary" : "text-muted"
              }`}
            >
              Análises
            </Text>

            {isAnalysisActive && (
              <View className="w-1/2 h-[2px] bg-primary mt-1" />
            )}
          </Pressable>
          
        </View>
      </View>
    </SafeAreaView>
  );
}