import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { useGlobalToast } from "@/components/global-toast";
import { FormComponent } from "@/features/forms/components/form-component";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { ClipboardList } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { Mabc2MotorDevelopmentCard } from "../components/mabc2-motor-development-card";
import {
  useProtocolRecordDetail,
  type Mabc2Detail,
} from "../hooks/use-protocol-record-detail";
import type { ProtocolTipo } from "../hooks/use-protocol-records";

/** Display labels for each protocol type. */
const PROTOCOL_LABELS: Record<ProtocolTipo, string> = {
  ata: "ATA",
  cars: "CARS",
  mabc2: "MABC-2",
};

/** Props for {@link RecordHeaderCard}. */
type RecordHeaderProps = {
  label: string;
  dateLabel: string;
  scoreLabel?: string | null;
  ageGroupLabel?: string | null;
  evaluatorName?: string | null;
};

/** Header card summarizing a protocol record's metadata. */
function RecordHeaderCard({
  label,
  dateLabel,
  scoreLabel,
  ageGroupLabel,
  evaluatorName,
}: RecordHeaderProps) {
  const { t } = useI18n();
  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-outline bg-level2 p-4">
      <View
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${colors.primary}26` }}
      >
        <ClipboardList size={22} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-content">{label}</Text>
        <Text className="mt-1 text-sm text-muted">
          {t("analysis.protocolCard.record")}: <Text className="text-content font-medium">{dateLabel}</Text>
        </Text>
        {ageGroupLabel ? (
          <Text className="mt-1 text-sm text-muted">
            {t("analysis.protocolCard.ageGroup")}:{" "}
            <Text className="text-content font-medium">{ageGroupLabel}</Text>
          </Text>
        ) : null}
        {scoreLabel != null ? (
          <Text className="mt-1 text-sm text-muted">
            {t("analysis.mabc.totalScore")}:{" "}
            <Text className="text-content font-medium">{scoreLabel}</Text>
          </Text>
        ) : null}
        {evaluatorName ? (
          <Text className="mt-1 text-sm text-muted">
            {t("analysis.protocolCard.evaluatedBy")}:{" "}
            <Text className="text-content font-medium">{evaluatorName}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Props for {@link ProtocolVisualizationScreen}. */
export type ProtocolVisualizationScreenProps = {
  tipo: ProtocolTipo;
  recordId: string;
  studentId?: string;
  studentName: string;
  label?: string;
  dateLabel?: string;
  scoreLabel?: string | null;
  onPressBack?: () => void;
};

/**
 * Shows a single protocol record: ATA/CARS are editable inline (each question
 * with its score and notes), while MABC-2 is read-only.
 */
export function ProtocolVisualizationScreen({
  tipo,
  recordId,
  studentId,
  studentName,
  label,
  dateLabel,
  scoreLabel,
  onPressBack,
}: ProtocolVisualizationScreenProps) {
  const { t } = useI18n();
  const { detail, isLoading, error } = useProtocolRecordDetail(tipo, recordId);
  const protocolLabel = PROTOCOL_LABELS[tipo];
  const { showToast } = useGlobalToast();
  const formRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);

  const isEditable = tipo === "ata" || tipo === "cars";

  const handleSave = async () => {
    if (!formRef.current || saving) return;
    setSaving(true);
    const result = await formRef.current.handleSave(true);
    setSaving(false);

    if (result?.success) {
      onPressBack?.();
      showToast({
        mode: "success",
        title: t("analysis.protocolViz.formSaved"),
        description: t("analysis.protocolViz.formSavedDesc"),
      });
    } else if (result) {
      showToast({
        mode: "error",
        title: result.title || t("analysis.protocolViz.saveError"),
        description: result.description,
      });
    }
  };

  if (isEditable) {
    const totalLabel =
      tipo === "ata"
        ? detail?.ata?.total != null
          ? String(detail.ata.total)
          : scoreLabel ?? "—"
        : detail?.cars?.total != null
          ? String(detail.cars.total).replace(".", ",")
          : scoreLabel ?? "—";

    return (
      <View className="flex-1 bg-level1">
        <Header
          variant="form"
          onPressBack={onPressBack}
          onPressSave={handleSave}
        />

        <View className="mx-8 mt-5">
          <Text className="text-header-1 text-content">
            {protocolLabel} - {studentName}
          </Text>
        </View>

        <View className="flex-1 mt-5 px-8">
          {isLoading ? (
            <View className="py-16 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <Text className="mt-10 text-center text-default-2 text-extra">
              {t("analysis.protocolList.loadError")}
            </Text>
          ) : (
            <>
              <RecordHeaderCard
                label={label ?? t("analysis.protocolViz.formLabel").replace("{x}", protocolLabel)}
                dateLabel={dateLabel ?? ""}
                scoreLabel={totalLabel}
              />
              <View className="flex-1 mt-5">
                <FormComponent
                  ref={formRef}
                  formularioId={recordId}
                  alunoId={studentId ?? ""}
                />
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

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
          {t("analysis.protocolList.loadError")}
        </Text>
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

          <Text className="mt-6 mb-3 text-header-3 text-content">{t("analysis.protocolViz.testSummary")}</Text>
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
        {t("analysis.protocolViz.noData")}
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-8 mt-5">
        <Text className="text-header-1 text-content">
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
