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
import { ActivityIndicator, Image, View } from "react-native";

export default function ReportsRoute() {
  const router = useRouter();
  const { students, isLoading: isStudentsLoading, refresh: refreshStudents } = useStudents();
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [isCountsLoading, setIsCountsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCounts() {
      try {
        setIsCountsLoading(true);
        const { data } = await supabase.from("relatorios").select("aluno_id");
        const counts: Record<string, number> = {};
        data?.forEach((r: any) => {
          if (r.aluno_id) counts[r.aluno_id] = (counts[r.aluno_id] || 0) + 1;
        });
        setReportCounts(counts);
      } catch (err) {
        console.error("Erro ao buscar contagem de relatórios:", err);
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

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isStudentsLoading || isCountsLoading;

  return (
    <View className="flex-1 bg-level1">
      <Header />
      <View className="flex-1 mx-8">
        <View className="mt-5">
          <SectionField mode="reports" />
        </View>

        <View className="mt-5 w-full">
          <PageHeader
            title="Relatórios"
            subtitle="Selecione um aluno para ver os relatórios registrados"
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
              onRefresh={refreshStudents}
              contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
              renderItem={({ item }) => {
                const count = reportCounts[item.id] || 0;
                return (
                  <ListCard
                    title={item.name}
                    subtitle={`${count} relatório${count !== 1 ? "s" : ""}`}
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
                    enableRipple
                    onPress={() =>
                      router.push({
                        pathname: "/reports/[studentId]",
                        params: { studentId: item.id, studentName: item.name },
                      } as any)
                    }
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
