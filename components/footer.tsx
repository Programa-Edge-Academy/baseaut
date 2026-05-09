import { BarChart3, Dumbbell, Users } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

type FooterTab = "activity" | "start" | "analysis";

export function Footer() {
  const [selectedTab, setSelectedTab] = useState<FooterTab>("activity");

  const primary = "#0E89E5";
  const muted = "#66758A";

  return (
    <View className="w-full items-center">
      <View className="w-full items-center justify-center bg-level1 p-4">

        <View className="w-full flex-row justify-between mx-4">

          {/* Activity */}
          <Pressable
            onPress={() => setSelectedTab("activity")}
            className="items-center"
          >
            <Dumbbell
              size={28}
              color={selectedTab === "activity" ? primary : muted}
            />

            <Text
              className={`font-inter text-xs mt-1 ${
                selectedTab === "activity" ? "text-primary" : "text-muted"
              }`}
            >
              Atividades
            </Text>

            {selectedTab === "activity" && (
              <View className="w-full h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

          {/* Start */}
          <Pressable
            onPress={() => setSelectedTab("start")}
            className="items-center"
          >
            <Users
              size={28}
              color={selectedTab === "start" ? primary : muted}
            />

            <Text
              className={`font-inter text-xs mt-1 ${
                selectedTab === "start" ? "text-primary" : "text-muted"
              }`}
            >
              Início
            </Text>

            {selectedTab === "start" && (
              <View className="w-full h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

          {/* Analysis */}
          <Pressable
            onPress={() => setSelectedTab("analysis")}
            className="items-center"
          >
            <BarChart3
              size={28}
              color={selectedTab === "analysis" ? primary : muted}
            />

            <Text
              className={`font-inter text-xs mt-1 ${
                selectedTab === "analysis" ? "text-primary" : "text-muted"
              }`}
            >
              Análise
            </Text>

            {selectedTab === "analysis" && (
              <View className="w-full h-[2px] bg-primary mt-1" />
            )}
          </Pressable>

        </View>

      </View>
    </View>
  );
}
