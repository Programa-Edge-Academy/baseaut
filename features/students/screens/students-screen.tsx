import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SearchInput } from "@/components/search-input";
import React from "react";
import { View } from "react-native";
import { PageHeader } from "@/components/page-header";

export function StudentsScreen() {
  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1">
        <View className="mx-8 mt-5">
          <PageHeader
            mode="inicio"
            title="Início"
            subtitle="Selecione um aluno para iniciar uma sessão"
            onNewPress={() => {}}
          />
        </View>
        <SearchInput containerClassName="mx-8 mt-5" />
      </View>
      <Footer />
    </View>
  );
}
