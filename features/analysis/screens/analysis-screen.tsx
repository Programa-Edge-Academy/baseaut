import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { SectionField } from "@/components/section-field";
import { SwipeNavigator } from "@/components/swipe-navigator";
import { useStudents } from "@/features/students/hooks/use-students";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, View } from "react-native";

/**
 * Analysis landing screen. Lists students with their session/form counts,
 * supports name search, and navigates to a student's analysis overview. Also
 * serves as the entry point of the Analysis guided tutorial simulation.
 */
export default function AnalysisScreen() {
    const router = useRouter();
    const { t } = useI18n();
    const sessionSim = useSessionSimController();
    const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
    const sim = useTutorialSimulation();
    const [noticeOpen, setNoticeOpen] = useState(false);

    const { students, isLoading: isStudentsLoading, refresh: refreshStudents } = useStudents({ mock: isTutorial });
    const [sessionsCounts, setSessionsCounts] = useState<Record<string, number>>({});
    const [isCountsLoading, setIsCountsLoading] = useState(!isTutorial);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isTutorial) {
            setIsCountsLoading(false);
            return;
        }
        async function fetchCounts() {
            try {
                setIsCountsLoading(true);
                const { data: sessions } = await supabase
                    .from("sessoes")
                    .select("aluno_id")
                    .neq("status", "cancelada");
                const { data: forms } = await supabase
                    .from("formularios")
                    .select("aluno_id")
                    .neq("tipo", "registro_controle")
                    .eq("ativo", true);

                const counts: Record<string, number> = {};
                sessions?.forEach((s) => {
                    if (s.aluno_id) counts[s.aluno_id] = (counts[s.aluno_id] || 0) + 1;
                });
                forms?.forEach((f) => {
                    if (f.aluno_id) counts[f.aluno_id] = (counts[f.aluno_id] || 0) + 1;
                });
                setSessionsCounts(counts);
            } catch {
            } finally {
                setIsCountsLoading(false);
            }
        }

        if (students.length > 0) {
            fetchCounts();
        } else {
            setIsCountsLoading(false);
        }
    }, [students, isTutorial]);

    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = isStudentsLoading || isCountsLoading;

    const list = (
        <View className="flex-1 mx-8">
            <View className="mt-5">
                <SectionField mode="analysis"></SectionField>
            </View>

            <View className="mt-5 w-full">
                <PageHeader
                    title={t("analysis.title")}
                    subtitle={t("analysis.subtitle")}
                />
            </View>

            <View className="mt-4 w-full">
                <SearchInput
                    placeholder={t("common.searchPlaceholder")}
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
                        emptyMessage={t("students.empty")}
                        onRefresh={refreshStudents}
                        contentContainerStyle={{ flexGrow: 1 }}
                        renderItem={({ item, index }) => {
                            const count = sessionsCounts[item.id] || 0;
                            const card = (
                                <ListCard
                                    title={item.name}
                                    subtitle={(count === 1 ? t("analysis.list.sessionsRecordedOne") : t("analysis.list.sessionsRecordedMany")).replace("{n}", String(count))}
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
                                        if (isTutorial) sim.complete("selectStudent");
                                        router.push(`/analysis/${item.id}` as any);
                                    }}
                                    spotlightKeys={
                                        // A key maps to a single target, so only the first
                                        // card is highlighted — any student works here.
                                        isTutorial && index === 0 ? "selectStudent" : undefined
                                    }
                                />
                            );
                            return card;
                        }}
                    />
                </View>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-level1">
            {isTutorial ? (
                <Header
                    variant="tutorial"
                    onPressBack={() => router.back()}
                    onPressFinish={() => setNoticeOpen(true)}
                />
            ) : (
                <Header />
            )}

            {isTutorial ? (
                list
            ) : (
                <SwipeNavigator onSwipeRight={() => router.replace("/students")}>
                    {list}
                </SwipeNavigator>
            )}

            {!isTutorial && <Footer />}

            {isTutorial && (
                <TutorialPracticeNotice
                    visible={noticeOpen}
                    onClose={() => setNoticeOpen(false)}
                    onExit={() => setNoticeOpen(false)}
                />
            )}

            {isTutorial && <TutorialSpotlight />}
        </View>
    );
}
