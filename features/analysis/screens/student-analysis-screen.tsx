import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { AnalysisOptionCard } from "@/features/analysis/components/analysis-option-card";
import { AppliedProtocolsCard } from "@/features/analysis/components/applied-protocols-card";
import { StudentInfoCard } from "@/features/analysis/components/student-info-card";
import type { ProtocolTipo } from "@/features/analysis/hooks/use-protocol-records";
import { useProtocolStatuses } from "@/features/analysis/hooks/use-protocol-statuses";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

/**
 * Analysis overview for a single student: profile info plus entry points to
 * exercise progress, help records, observed behaviors, period comparison,
 * applied protocols, and motor development records. Guards access to coordinators
 * and monitors.
 */
export function StudentAnalysisScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { sessions, profile, isLoading } = useStudentSessions(studentId as string);
  const { statuses: protocolStatuses } = useProtocolStatuses(studentId as string);

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAuthorized(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("perfis")
          .select("perfil")
          .eq("id", user.id)
          .single();

        const role = profileData?.perfil || user.user_metadata?.perfil || user.user_metadata?.role;

        if (role === "coordenador" || role === "monitor") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      }
    }
    checkAccess();
  }, []);

  const openProtocol = (tipo: ProtocolTipo) =>
    router.push({
      pathname: "/protocol-records",
      params: {
        studentId: String(studentId ?? ""),
        studentName: profile?.name ?? "Aluno",
        tipo,
      },
    });

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} className="flex-1">
        <View className="mx-8 mt-5">
          {isLoading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-between pb-5 mb-5">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-level2 mr-3 overflow-hidden">
                    {profile?.avatarUrl ? (
                      <Image
                        source={{ uri: profile.avatarUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <User size={20} color={colors.muted} />
                    )}
                  </View>

                  <View className="flex-1 justify-center">
                    <Text className="text-xl font-bold text-white leading-tight" numberOfLines={1}>
                      {profile?.name || "Aluno"}
                    </Text>
                    <Text className="text-sm font-medium text-muted mt-0.5">
                      {sessions.length} {sessions.length === 1 ? "sessão registrada" : "sessões registradas"}
                    </Text>
                  </View>
                </View>
              </View>

              <StudentInfoCard
                name={profile?.name || "Aluno"}
                avatarUrl={profile?.avatarUrl}
                height={profile?.height}
                weight={profile?.weight}
                waist={profile?.waist}
                birthDate={profile?.birthDate}
                supportLevel={profile?.supportLevel}
                observations={profile?.observations}
              />

              <View className="flex-col gap-4">
                <AnalysisOptionCard
                  title="Progresso por exercício"
                  description="Acompanhe a evolução de cada exercício nas sessões."
                  onPress={() => {
                    router.push(`/analysis/progress/${studentId}` as any);
                  }}
                />

                <AnalysisOptionCard
                  title="Registros de ajuda por sessão"
                  description="Acompanhe a evolução da autonomia nas sessões."
                  onPress={() => {
                    router.push({
                      pathname: "/analysis/help/[studentId]",
                      params: {
                        studentId: String(studentId ?? ""),
                        studentName: profile?.name ?? "Aluno",
                      },
                    } as any);
                  }}
                />

                <AnalysisOptionCard
                  title="Comportamentos observados"
                  description="Visualize a frequência dos comportamentos observados"
                  onPress={() => {
                    router.push(`/analysis/behaviors/${studentId}` as any);
                  }}
                />

                <AnalysisOptionCard
                  title="Comparar desempenho"
                  description="Compare dois períodos e acompanhe diferenças no desempenho do aluno."
                  onPress={() => {
                    router.push(`/analysis/compare/${studentId}` as any);
                  }}
                />

                <AppliedProtocolsCard
                  carsStatus={protocolStatuses.cars}
                  ataStatus={protocolStatuses.ata}
                  onCarsPress={() => openProtocol("cars")}
                  onAtaPress={() => openProtocol("ata")}
                />

                <AnalysisOptionCard
                  title="Registros de desenvolvimento motor"
                  description="Visualize e registre avaliações motoras do aluno."
                  onPress={() => {
                    router.push({
                      pathname: "/mabc2-records",
                      params: {
                        studentId: String(studentId ?? ""),
                        studentName: profile?.name ?? "Aluno",
                      },
                    } as any);
                  }}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

    </View>
  );
}