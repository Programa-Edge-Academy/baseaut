import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { AnalysisOptionCard } from "@/features/analysis/components/analysis-option-card";
import { AppliedProtocolsCard } from "@/features/analysis/components/applied-protocols-card";
import { StudentInfoCard } from "@/features/analysis/components/student-info-card";
import type { ProtocolTipo } from "@/features/analysis/hooks/use-protocol-records";
import { useProtocolStatuses } from "@/features/analysis/hooks/use-protocol-statuses";
import { useStudentSessions } from "@/features/sessions/hooks/use-student-sessions";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

/**
 * Analysis overview for a single student: profile info plus entry points to
 * exercise progress, help records, observed behaviors, period comparison,
 * applied protocols, and motor development records. Guards access to coordinators
 * and monitors.
 */
export function StudentAnalysisScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { studentId } = useLocalSearchParams();
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { sessions, profile, isLoading } = useStudentSessions(studentId as string, { mock: isTutorial });
  const { statuses: protocolStatuses } = useProtocolStatuses(studentId as string, { mock: isTutorial });

  const openProtocol = (tipo: ProtocolTipo) =>
    router.push({
      pathname: "/protocol-records",
      params: {
        studentId: String(studentId ?? ""),
        studentName: profile?.name ?? t("common.student"),
        tipo,
      },
    });

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => router.back()}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
      />

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
                    <Text className="text-xl font-bold text-content leading-tight" numberOfLines={1}>
                      {profile?.name || t("common.student")}
                    </Text>
                    <Text className="text-sm font-medium text-muted mt-0.5">
                      {(sessions.length === 1 ? t("analysis.list.sessionsRecordedOne") : t("analysis.list.sessionsRecordedMany")).replace("{n}", String(sessions.length))}
                    </Text>
                  </View>
                </View>
              </View>

              <StudentInfoCard
                name={profile?.name || t("common.student")}
                avatarUrl={profile?.avatarUrl}
                height={profile?.height}
                weight={profile?.weight}
                waist={profile?.waist}
                birthDate={profile?.birthDate}
                supportLevel={profile?.supportLevel}
                observations={profile?.observations}
              />

              <View className="flex-col gap-4">
                <SpotlightTarget targetKey="openProgress">
                  <AnalysisOptionCard
                    title={t("analysis.card.progress.title")}
                    description={t("analysis.card.progress.desc")}
                    onPress={() => {
                      if (isTutorial) sim.complete("openProgress");
                      router.push(`/analysis/progress/${studentId}` as any);
                    }}
                  />
                </SpotlightTarget>

                <SpotlightTarget targetKey="openHelp">
                  <AnalysisOptionCard
                    title={t("analysis.card.help.title")}
                    description={t("analysis.card.help.desc")}
                    onPress={() => {
                      if (isTutorial) sim.complete("openHelp");
                      router.push({
                        pathname: "/analysis/help/[studentId]",
                        params: {
                          studentId: String(studentId ?? ""),
                          studentName: profile?.name ?? t("common.student"),
                        },
                      } as any);
                    }}
                  />
                </SpotlightTarget>

                <SpotlightTarget targetKey="openBehaviors">
                  <AnalysisOptionCard
                    title={t("analysis.card.behaviors.title")}
                    description={t("analysis.card.behaviors.desc")}
                    onPress={() => {
                      if (isTutorial) sim.complete("openBehaviors");
                      router.push(`/analysis/behaviors/${studentId}` as any);
                    }}
                  />
                </SpotlightTarget>

                <SpotlightTarget targetKey="openCompare">
                  <AnalysisOptionCard
                    title={t("analysis.card.compare.title")}
                    description={t("analysis.card.compare.desc")}
                    onPress={() => {
                      if (isTutorial) sim.complete("openCompare");
                      router.push(`/analysis/compare/${studentId}` as any);
                    }}
                  />
                </SpotlightTarget>

                <SpotlightTarget targetKey="openProtocols">
                  <AppliedProtocolsCard
                    ataStatus={protocolStatuses.ata}
                    carsStatus={protocolStatuses.cars}
                    onAtaPress={() => {
                      if (isTutorial) sim.complete("openProtocols");
                      openProtocol("ata");
                    }}
                    onCarsPress={() => {
                      if (isTutorial) sim.complete("openProtocols");
                      openProtocol("cars");
                    }}
                  />
                </SpotlightTarget>

                <SpotlightTarget targetKey="openMabc">
                  <AnalysisOptionCard
                    title={t("analysis.card.mabc.title")}
                    description={t("analysis.card.mabc.desc")}
                    onPress={() => {
                      if (isTutorial) sim.complete("openMabc");
                      router.push({
                        pathname: "/mabc2-records",
                        params: {
                          studentId: String(studentId ?? ""),
                          studentName: profile?.name ?? t("common.student"),
                        },
                      } as any);
                    }}
                  />
                </SpotlightTarget>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {isTutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => {
            setNoticeOpen(false);
            sessionSim.stop();
            router.back();
          }}
        />
      )}

      {isTutorial && <TutorialSpotlight />}
    </View>
  );
}