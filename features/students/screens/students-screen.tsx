import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SearchInput } from "@/components/search-input";
import React from "react";
import { View } from "react-native";

export function StudentsScreen() {
  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1">
        <SearchInput containerClassName="mx-4 mt-4" />
      </View>
      <Footer />
    </View>
  );
}
