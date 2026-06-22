import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { ClipboardList } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { Mabc2MotorDevelopmentCard } from "../components/mabc2-motor-development-card";
import {
  useProtocolRecordDetail,
  type Mabc2Detail,
} from "../hooks/use-protocol-record-detail";
import type { ProtocolTipo } from "../hooks/use-protocol-records";

const PROTOCOL_LABELS: Record<ProtocolTipo, string> = {
  ata: "ATA",
  cars: "CARS",
  mabc2: "MABC-2",
};

type RecordHeaderProps = {
  label: string;
  dateLabel: string;
  scoreLabel?: string | null;
  ageGroupLabel?: string | null;
  evaluatorName?: string | null;
};

function RecordHeaderCard({
  label,
  dateLabel,
  scoreLabel,
  ageGroupLabel,
  evaluatorName,
}: RecordHeaderProps) {
  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-outline bg-level2 p-4">
      <View
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${colors.primary}26` }}
      >
        <ClipboardList size={22} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-white">{label}</Text>
        <Text className="mt-1 text-sm text-muted">
          Registro: <Text className="text-white font-medium">{dateLabel}</Text>
        </Text>
        {ageGroupLabel ? (
          <Text className="mt-1 text-sm text-muted">
            Grupo de idade:{" "}
            <Text className="text-white font-medium">{ageGroupLabel}</Text>
          </Text>
        ) : null}
        {scoreLabel != null ? (
          <Text className="mt-1 text-sm text-muted">
            Pontuação total:{" "}
            <Text className="text-white font-medium">{scoreLabel}</Text>
          </Text>
        ) : null}
        {evaluatorName ? (
          <Text className="mt-1 text-sm text-muted">
            Avaliado por:{" "}
            <Text className="text-white font-medium">{evaluatorName}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ScoreBadge({ label }: { label: string }) {
  return (
    <View
      className="min-w-[34px] items-center justify-center rounded-lg px-2 py-1"
      style={{ backgroundColor: `${colors.secondary}26` }}
    >
      <Text className="text-sm font-bold" style={{ color: colors.secondary }}>
        {label}
      </Text>
    </View>
  );
}

export type ProtocolVisualizationScreenProps = {
  tipo: ProtocolTipo;
  recordId: string;
  studentName: string;
  label?: string;
  dateLabel?: string;
  scoreLabel?: string | null;
  onPressBack?: () => void;
};

export function ProtocolVisualizationScreen({
  tipo,
  recordId,
  studentName,
  label,
  dateLabel,
  scoreLabel,
  onPressBack,
}: ProtocolVisualizationScreenProps) {
  const { detail, isLoading, error } = useProtocolRecordDetail(tipo, recordId);
  const protocolLabel = PROTOCOL_LABELS[tipo];

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <Text className="mt-10 text-center text-default-2 text-extra">
          {error.message || "Erro ao carregar o registro."}
        </Text>
      );
    }

    if (tipo === "ata" && detail?.ata) {
      const totalLabel =
        detail.ata.total != null ? String(detail.ata.total) : scoreLabel ?? "—";
      return (
        <>
          <RecordHeaderCard
            label={label ?? `Formulário ${protocolLabel}`}
            dateLabel={dateLabel ?? ""}
            scoreLabel={totalLabel}
          />
          <View className="mt-5 gap-3">
            {detail.ata.sections.map((section) => (
              <View
                key={section.id}
                className="flex-row items-center gap-3 rounded-2xl border border-outline bg-level2 p-4"
              >
                <Text className="flex-1 text-default-2 text-white">
                  {section.title}
                </Text>
                <ScoreBadge label={section.valueLabel} />
              </View>
            ))}
          </View>
        </>
      );
    }

    if (tipo === "cars" && detail?.cars) {
      const totalLabel =
        detail.cars.total != null
          ? String(detail.cars.total).replace(".", ",")
          : scoreLabel ?? "—";
      return (
        <>
          <RecordHeaderCard
            label={label ?? `Formulário ${protocolLabel}`}
            dateLabel={dateLabel ?? ""}
            scoreLabel={totalLabel}
          />
          <View className="mt-5 gap-3">
            {detail.cars.domains.map((domain) => (
              <View
                key={domain.id}
                className="rounded-2xl border border-outline bg-level2 p-4"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="flex-1 text-default-2 font-medium text-white">
                    {domain.title}
                  </Text>
                  <ScoreBadge label={domain.scoreLabel} />
                </View>
                <View className="mt-3 rounded-xl border border-outline bg-level1 p-3">
                  <Text className="text-xs text-muted">Observações</Text>
                  <Text className="mt-1 text-sm text-white">
                    {domain.observation ?? "Sem observações registradas."}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      );
    }

    if (tipo === "mabc2" && detail?.mabc2) {
      const mabc: Mabc2Detail = detail.mabc2;
      return (
        <>
          <RecordHeaderCard
            label={label ?? mabc.titulo}
            dateLabel={dateLabel ?? mabc.dateLabel}
            ageGroupLabel={mabc.ageGroupLabel}
            evaluatorName={mabc.evaluatorName}
          />

          <Text className="mt-6 mb-3 text-header-3 text-white">Resumo do teste</Text>
          <Mabc2MotorDevelopmentCard
            readOnly
            recordCount={mabc.components.reduce((acc, c) => acc + c.items.length, 0)}
            totalScore={mabc.totalScore}
            totalPercentile={mabc.totalPercentile}
            sections={mabc.components.map((component) => ({
              title: component.title,
              categoryScore: component.categoryScore,
              categoryPercentile: component.categoryPercentile,
              readOnly: true,
              exercises: component.items.map((item) => ({
                name: item.name,
                unit: item.unit,
                attemptCount: item.rawScore,
                score: null,
                readOnly: true,
              })),
            }))}
          />
        </>
      );
    }

    return (
      <Text className="mt-10 text-center text-muted text-default-2">
        Nenhum dado disponível para este registro.
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-8 mt-5">
        <Text className="text-header-1 text-white">
          {protocolLabel} - {studentName}
        </Text>
      </View>

      <ScrollView
        className="mt-5 px-8"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {renderBody()}
      </ScrollView>

    </View>
  );
}
