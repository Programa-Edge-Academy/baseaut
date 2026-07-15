import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { User } from "lucide-react-native";

import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";

import { useHistory } from "@/features/sessions/hooks/use-history";

/**
 * Route listing students that have session history, with real-time name search
 * and navigation into each student's record history. Also serves as the entry
 * point of the History guided tutorial simulation.
 */
export default function HistoryScreen() {
  const { t } = useI18n();
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "history";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);

  const { studentsHistory, isLoading, error, refetch } = useHistory({ mock: isTutorial });
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const [query, setQuery] = useState("");

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return studentsHistory.filter((student) => {
      return !normalizedQuery || student.name.toLowerCase().includes(normalizedQuery);
    });
  }, [query, studentsHistory]);

  const renderListBody = () => {
    if (isLoading) {
      return (
        <View className="mt-16 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View className="mt-16 items-center justify-center px-8">
          <Text className="text-center text-base font-medium text-extra">
            {error.message || t("history.loadError")}
          </Text>
        </View>
      );
    }

    return (
      <DataList
        className="mt-5 px-8"
        data={filteredHistory}
        emptyMessage={t("history.empty")}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const card = (
            <ListCard
              title={item.name}
              subtitle={`${item.sessions} ${t("history.recordsSuffix")}`}
              pendencyAlert={item.pendencyAlert}
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
              onPress={() => {
                if (isTutorial) sim.complete("selectStudent");
                router.push(`../history/${item.id}`);
              }}
              enableRipple={true}
            />
          );

          return isTutorial ? (
            <SpotlightTarget targetKey="selectStudent">{card}</SpotlightTarget>
          ) : (
            card
          );
        }}
      />
    );
  };

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => router.back()}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
      />

      <View className="mx-8 mt-5">
        <PageHeader
          title={t("history.title")}
          subtitle={t("history.subtitle")}
        />
      </View>

      <View className="flex-1">
        <View className="relative z-10 mx-8 mt-5">
          <SearchInput
            placeholder={t("common.searchPlaceholder")}
            value={query}
            onChangeText={setQuery}
            showTags={false}
          />
        </View>

        {renderListBody()}
      </View>

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
