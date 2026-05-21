import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import React from "react";
import { View } from "react-native";
import { SectionField } from "@/components/section-field";

export default function ReportsRoute() {
  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1 mx-8">
        <View className="mt-5">
          <SectionField mode="reports"></SectionField>
        </View>

        <View className="mt-5 w-full">
          <PageHeader
            title="Relatórios"
            subtitle="Selecione um aluno para ver os relatórios registrados"
          />
        </View>
      </View>
      <Footer />
    </View>
  );
}