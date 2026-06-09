import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { SectionField } from "@/components/section-field";
import { useStudents } from "@/features/students/hooks/use-students";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Image } from "react-native";

export default function AnalysisRoute() {
  const router = useRouter();
  const { students, isLoading: isStudentsLoading } = useStudents();
  const [sessionsCounts, setSessionsCounts] = useState<Record<string, number>>({});
  const [isCountsLoading, setIsCountsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCounts() {
      try {
        setIsCountsLoading(true);
        const { data: sessions } = await supabase
          .from("sessoes")
          .select("aluno_id");
        const { data: forms } = await supabase
          .from("formularios")
          .select("aluno_id");

        const counts: Record<string, number> = {};
        sessions?.forEach((s) => {
          if (s.aluno_id) counts[s.aluno_id] = (counts[s.aluno_id] || 0) + 1;
        });
        forms?.forEach((f) => {
          if (f.aluno_id) counts[f.aluno_id] = (counts[f.aluno_id] || 0) + 1;
        });
        setSessionsCounts(counts);
      } catch (err) {
        console.error("Erro ao buscar contagem de sessões:", err);
      } finally {
        setIsCountsLoading(false);
      }
    }

    if (students.length > 0) {
      fetchCounts();
    } else {
      setIsCountsLoading(false);
    }
  }, [students]);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isStudentsLoading || isCountsLoading;

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
          <SearchInput
            placeholder="Buscar aluno por nome..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="mt-4 w-full flex-1">
            <DataList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              emptyMessage="Nenhum aluno encontrado."
              contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
              renderItem={({ item }) => {
                const count = sessionsCounts[item.id] || 0;
                return (
                  <ListCard
                    title={item.name}
                    subtitle={`${count} sessão${count !== 1 ? "s" : ""} registrada${count !== 1 ? "s" : ""}`}
                    icon={
                      item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          style={{ width: "100%", height: "100%", borderRadius: 12 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <User size={20} color={colors.muted} />
                      )
                    }
                    iconBgColor={item.avatarUrl ? "transparent" : undefined}
                    rightAction="none"
                    enableRipple={true}
                    onPress={() => {
                      router.push(`/analysis/${item.id}` as any);
                    }}
                  />
                );
              }}
            />
          </View>
        )}
      </View>
      <Footer />
    </View>
  );
}
