import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { Toast, type ToastMode } from "@/components/toast";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Mabc2Record, Mabc2RecordCard } from "../components/mabc2-record-card";

/** Props for {@link Mabc2RecordsListScreen}. */
export type Mabc2RecordsListScreenProps = {
  studentName: string;
  records: Mabc2Record[];
  isLoading?: boolean;
  onRefresh?: () => void;
  toastConfig?: { visible: boolean; mode: ToastMode; title: string; description?: string };
  onHideToast?: () => void;
  onPressBack?: () => void;
  onPressNewRecord?: () => void;
  onPressRecord?: (record: Mabc2Record) => void;
};

/** Lists a student's MABC-2 records with create and open actions and a toast. */
export function Mabc2RecordsListScreen({
  studentName,
  records,
  isLoading = false,
  onRefresh,
  toastConfig,
  onHideToast,
  onPressBack,
  onPressNewRecord,
  onPressRecord,
}: Mabc2RecordsListScreenProps) {
  const { t } = useI18n();
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => {
          if (isTutorial) sim.complete("backMabc");
          onPressBack?.();
        }}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
        backSpotlightKey={isTutorial ? "backMabc" : undefined}
      />

      <View className="mx-5 mt-5">
        <PageHeader
          mode="exercicios"
          title={`MABC-2 — ${studentName}`}
          subtitle={t("analysis.mabcList.subtitle")}
          onNewPress={onPressNewRecord}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DataList
          className="mx-5 mt-3"
          data={records}
          emptyMessage={t("analysis.mabcList.empty")}
          onRefresh={onRefresh}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const cardNode = (
              <Mabc2RecordCard
                record={item}
                onPress={() => {
                  if (isTutorial && sim.currentKey === "openMabcRecord") {
                    sim.complete("openMabcRecord");
                  }
                  onPressRecord?.(item);
                }}
              />
            );
            return isTutorial && index === 0 ? (
              <SpotlightTarget targetKey="openMabcRecord">{cardNode}</SpotlightTarget>
            ) : (
              cardNode
            );
          }}
        />
      )}

      {toastConfig && (
        <Toast
          visible={toastConfig.visible}
          mode={toastConfig.mode}
          title={toastConfig.title}
          description={toastConfig.description}
          onHide={onHideToast}
        />
      )}

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