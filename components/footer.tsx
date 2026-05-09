import { BarChart3, Dumbbell, Users } from "lucide-react-native";
import React, { useState } from "react";
import { colors } from "@/assets/colors";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Text, StyleSheet, View } from "react-native";

type FooterTab = "activity" | "start" | "analysis";

export function Footer() {
  const [selectedTab, setSelectedTab] = useState<FooterTab>("activity");

  return (
    <SafeAreaView edges={['bottom']} className="w-full bg-level2">
      <View className="w-full items-center justify-center bg-level2 p-4">
        <View className="w-full flex-row">
          <Pressable
            onPress={() => setSelectedTab("activity")}
            className="flex-1 items-center justify-center gap-1"
          >
            <View
              className={
                selectedTab === "activity" ? "text-primary" : "text-muted"
              }
            >
              <Dumbbell size={28} color={selectedTab === "activity" ? colors.primary : colors.muted} />
            </View>

            <Text
              className={`text-default-1 ${
                selectedTab === "activity" ? "text-primary" : "text-muted"
              }`}
            >
              Atividades
            </Text>

            {selectedTab === "activity" && (
              <View className="w-1/2 h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab("start")}
            className="flex-1 items-center justify-center gap-1"
          >
            <View
              className={
                selectedTab === "start" ? "text-primary" : "text-muted"
              }
            >
              <Users size={28} color={selectedTab === "start" ? colors.primary : colors.muted} />
            </View>

            <Text
              className={`text-default-1 ${
                selectedTab === "start" ? "text-primary" : "text-muted"
              }`}
            >
              Início
            </Text>

            {selectedTab === "start" && (
              <View className="w-1/2 h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab("analysis")}
            className="flex-1 items-center justify-center gap-1"
          >
            <View
              className={
                selectedTab === "analysis" ? "text-primary" : "text-muted"
              }
            >
              <BarChart3 size={28} color={selectedTab === "analysis" ? colors.primary : colors.muted} />
            </View>

            <Text
              className={`text-default-1 ${
                selectedTab === "analysis" ? "text-primary" : "text-muted"
              }`}
            >
              Análises
            </Text>

            {selectedTab === "analysis" && (
              <View className="w-1/2 h-[2px] bg-primary mt-1" />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}