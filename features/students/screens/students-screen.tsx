import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import React from "react";
import { View } from "react-native";

export function StudentsScreen() {
  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1">
      </View>
      <Footer />
    </View>
  );
}