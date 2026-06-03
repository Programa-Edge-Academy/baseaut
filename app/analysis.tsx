import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { SectionField } from "@/components/section-field";
import { User } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

export default function AnalysisRoute() {
  const students = [
    { id: "1", name: "Lucas", sessions: 3 },
    { id: "2", name: "Sofia", sessions: 2 },
    { id: "3", name: "Miguel", sessions: 1 },
    { id: "4", name: "Beatriz", sessions: 1 },
  ];

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

        <View className="mt-4 w-full">
          <SearchInput placeholder="Buscar aluno por nome..." />
        </View>

        <View className="mt-4 w-full flex-1">
          <DataList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListCard
                title={item.name}
                subtitle={`${item.sessions} sessão${item.sessions > 1 ? "s" : ""} registrada${item.sessions > 1 ? "s" : ""}`}
                icon={<User size={20} color={colors.muted} />}
                rightAction="none"
                enableRipple={true}
              />
            )}
          />
        </View>
      </View>
      <Footer />
    </View>
  );
}
