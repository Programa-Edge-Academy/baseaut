import { BarChart3, Dumbbell, Users } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

type FooterTab = "activity" | "start" | "analysis";

export function Footer() {
  const [selectedTab, setSelectedTab] = useState<FooterTab>("activity");

  return (
    <View className="w-full items-center">
      <View className="w-full items-center justify-center bg-level1 p-4">

        <View className="w-full flex-row justify-between mx-4">

          {/* Activity Tab */}
          <Pressable
            onPress={() => setSelectedTab("activity")}
            className="items-center justify-center gap-1"
          >
            <View
              className={
                selectedTab === "activity" ? "text-primary" : "text-muted"
              }
            >
              <Dumbbell size={28} color="currentColor" />
            </View>

            <Text
              className={`font-inter text-xs ${
                selectedTab === "activity"
                  ? "text-primary"
                  : "text-muted"
              }`}
            >
              Atividades
            </Text>

            {/* Active indicator line */}
            {selectedTab === "activity" && (
              <View className="w-full h-[2px] bg-primary" />
            )}
          </Pressable>

          {/* Start Tab */}
          <Pressable
            onPress={() => setSelectedTab("start")}
            className="items-center justify-center gap-1"
          >
            <View
              className={
                selectedTab === "start" ? "text-primary" : "text-muted"
              }
            >
              <Users size={28} color="currentColor" />
            </View>

            <Text
              className={`font-inter text-xs ${
                selectedTab === "start"
                  ? "text-primary"
                  : "text-muted"
              }`}
            >
              Início
            </Text>

            {selectedTab === "start" && (
              <View className="w-full h-[2px] bg-primary" />
            )}
          </Pressable>

          {/* Analysis Tab */}
          <Pressable
            onPress={() => setSelectedTab("analysis")}
            className="items-center justify-center gap-1"
          >
            <View
              className={
                selectedTab === "analysis" ? "text-primary" : "text-muted"
              }
            >
              <BarChart3 size={28} color="currentColor" />
            </View>

            <Text
              className={`font-inter text-xs ${
                selectedTab === "analysis"
                  ? "text-primary"
                  : "text-muted"
              }`}
            >
              Análise
            </Text>

            {selectedTab === "analysis" && (
              <View className="w-full h-[2px] bg-primary" />
            )}
          </Pressable>

        </View>

      </View>
    </View>
  );
}