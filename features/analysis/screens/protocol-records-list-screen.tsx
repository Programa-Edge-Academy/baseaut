import { colors } from "@/assets/colors";
import { DataList } from "@/components/data-list";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useSessionSimController } from "@/features/tutorial/contexts/session-simulation-controller";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { ProtocolEmptyState } from "../components/protocol-empty-state";
import { ProtocolRecordCard } from "../components/protocol-record-card";
import {
  useProtocolRecords,
  type ProtocolRecord,
  type ProtocolTipo,
} from "../hooks/use-protocol-records";

/** Display labels for each protocol type. */
const PROTOCOL_LABELS: Record<ProtocolTipo, string> = {
  ata: "ATA",
  cars: "CARS",
  mabc2: "MABC-2",
};

/** Props for {@link ProtocolRecordsListScreen}. */
export type ProtocolRecordsListScreenProps = {
  studentId: string;
  studentName: string;
  tipo: ProtocolTipo;
  onPressBack?: () => void;
  onPressRecord?: (record: ProtocolRecord) => void;
};

/** Lists a student's records for a protocol type, navigating to each on press. */
export function ProtocolRecordsListScreen({
  studentId,
  studentName,
  tipo,
  onPressBack,
  onPressRecord,
}: ProtocolRecordsListScreenProps) {
  const { t } = useI18n();
  const sessionSim = useSessionSimController();
  const isTutorial = sessionSim.active && sessionSim.kind === "analysis";
  const sim = useTutorialSimulation();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { records, isLoading, error, refetch } = useProtocolRecords(studentId, tipo, { mock: isTutorial });
  const protocolLabel = PROTOCOL_LABELS[tipo];

  return (
    <View className="flex-1 bg-level1">
      <Header
        variant="back"
        onPressBack={() => {
          if (isTutorial) sim.complete("backProtocols");
          onPressBack?.();
        }}
        onPressTutorial={isTutorial ? () => setNoticeOpen(true) : undefined}
        backSpotlightKey={isTutorial ? "backProtocols" : undefined}
      />

      <View className="flex-1">
        <View className="mx-8 mt-5">
          <PageHeader
            title={`${protocolLabel} - ${studentName}`}
            subtitle={
              records.length > 0
                ? (records.length === 1 ? t("analysis.protocolList.recordOne") : t("analysis.protocolList.recordMany")).replace("{n}", String(records.length))
                : t("analysis.protocolList.viewRecords")
            }
          />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View className="mt-16 items-center px-8">
            <Text className="text-center text-default-2 text-extra">
              {t("analysis.protocolList.loadError")}
            </Text>
          </View>
        ) : records.length === 0 ? (
          <ProtocolEmptyState />
        ) : (
          <DataList
            className="mx-8 mt-5"
            data={records}
            keyExtractor={(item) => item.id}
            emptyMessage={t("analysis.protocolList.noRecordsFound")}
            onRefresh={refetch}
            renderItem={({ item, index }) => {
              const cardNode = (
                <ProtocolRecordCard
                  record={item}
                  showAgeGroup={tipo === "mabc2"}
                  onPress={() => {
                    if (isTutorial && sim.currentKey === "openProtocolRecord") {
                      sim.complete("openProtocolRecord");
                    }
                    onPressRecord?.(item);
                  }}
                />
              );
              return isTutorial && index === 0 ? (
                <SpotlightTarget targetKey="openProtocolRecord">{cardNode}</SpotlightTarget>
              ) : (
                cardNode
              );
            }}
          />
        )}
      </View>

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
