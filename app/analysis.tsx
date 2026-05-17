import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import React from "react";
import { View } from "react-native";
import { SectionField } from "@/components/section-field";

export default function AnalysisRoute() {
  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1 mx-8">
        <View className="mt-5">
          <SectionField mode="analysis"></SectionField>
        </View>

        <View className="mt-5 w-full">
          <PageHeader
            title="Análises"
            subtitle="Selecione um aluno para ver o desempenho"
          />
        </View>
      </View>
      <Footer />
    </View>
  );
}