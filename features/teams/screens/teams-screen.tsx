import { Header } from "@/components/header";
import React from "react";
import { View } from "react-native";
import { PageHeader } from "@/components/page-header";
import { CompanionCard } from "@/features/teams/components/companion-card";
import { StudentCard } from "@/features/teams/components/student-card-team";

export function TeamScreen() {
  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" />
      <View className="flex-1 px-8 items-center">        
        <View className="mt-5 w-full">
          <PageHeader
            title="PEFaut"
            subtitle="Gerenciar equipe"
            onNewPress={() => {}}
          />
        </View>        
        <View className="mt-5 w-full">
          <CompanionCard
            className="max-w-none"
            companions={[
              { id: "1", name: "Maria Oliveira", email: "maria.oliveira@example.com" },
              { id: "2", name: "Carlos Pereira", email: "carlos.pereira@example.com", status: "pending" },
            ]}
          />
        </View>
        <View className="mt-5 w-full">
          <StudentCard
            className="max-w-none"
            students={[
              { id: "1", name: "João Silva" },
            ]}
          />
        </View>
      </View>
    </View>
  );
}