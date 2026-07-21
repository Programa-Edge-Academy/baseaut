import { colors } from "@/assets/colors";
import { useProtocolRecordDetail } from "@/features/analysis/hooks/use-protocol-record-detail";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

const MABC_COMPONENT_KEYS: Record<string, TranslationKey> = {
  destreza_manual: "reports.mabc.manualDexterity",
  mirar_pegar: "reports.mabc.aimingCatching",
  equilibrio: "reports.mabc.balance",
};

/** Returns a human-readable title for a MABC component key. */
function fmtComponentTitle(raw: string, t: (key: TranslationKey) => string): string {
  const key = MABC_COMPONENT_KEYS[raw];
  return key ? t(key) : raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Small pill displaying a score value. */
function ScoreBadge({ label }: { label: string }) {
  return (
    <View className="bg-level1 border border-outline rounded-lg px-3 py-1">
      <Text className="text-xs text-content font-bold">{label}</Text>
    </View>
  );
}

/** A label/score row separated by a divider. */
function SectionRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-outline">
      <Text className="text-xs text-content flex-1 mr-3" numberOfLines={2}>{label}</Text>
      <ScoreBadge label={value} />
    </View>
  );
}

/** Placeholder shown when a protocol has no answers. */
function EmptyProtocol() {
  const { t } = useI18n();
  return (
    <Text className="text-xs text-muted py-2">{t("reports.protocol.noAnswers")}</Text>
  );
}

/**
 * Read-only view of a single protocol record (ATA, CARS, or MABC-2), rendering
 * its scores and per-section/item answers based on the record type.
 */
export function ProtocolRecordView({
  tipo,
  recordId,
  dateLabel,
  responsavel,
  fallbackScore,
  fallbackPercentile,
}: {
  tipo: "ata" | "cars" | "mabc2";
  recordId: string;
  dateLabel: string;
  responsavel?: string;
  /** Score from the consolidated record, shown when the detail total is absent. */
  fallbackScore?: number | string | null;
  /** Percentile from the consolidated record (MABC-2), used as a fallback. */
  fallbackPercentile?: number | string | null;
}) {
  const { t } = useI18n();
  const { detail, isLoading } = useProtocolRecordDetail(tipo, recordId);
  const hasFallbackScore = fallbackScore != null && fallbackScore !== "";
  const hasFallbackPct = fallbackPercentile != null && fallbackPercentile !== "";

  if (isLoading) {
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!detail) return null;

  if (tipo === "ata" && detail.ata) {
    const hasResponses = detail.ata.sections.some((s) => s.value != null);
    return (
      <View className="border border-outline rounded-lg bg-level2 p-4 mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-bold text-content">ATA — {dateLabel}</Text>
          {detail.ata.total != null ? (
            <ScoreBadge label={`${t("reports.protocol.total")}: ${detail.ata.total}`} />
          ) : hasFallbackScore ? (
            <ScoreBadge label={`${t("reports.protocol.total")}: ${fallbackScore}`} />
          ) : null}
        </View>
        {responsavel && <Text className="text-xs text-muted mb-2">{t("reports.protocol.responsible")}: {responsavel}</Text>}
        {hasResponses ? (
          detail.ata.sections.map((section) => (
            <SectionRow key={section.id} label={section.title} value={section.valueLabel} />
          ))
        ) : (
          <EmptyProtocol />
        )}
      </View>
    );
  }

  if (tipo === "cars" && detail.cars) {
    const hasResponses = detail.cars.domains.some((d) => d.score != null);
    return (
      <View className="border border-outline rounded-lg bg-level2 p-4 mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-bold text-content">CARS — {dateLabel}</Text>
          {detail.cars.total != null ? (
            <ScoreBadge label={`${t("reports.protocol.total")}: ${detail.cars.total}`} />
          ) : hasFallbackScore ? (
            <ScoreBadge label={`${t("reports.protocol.total")}: ${fallbackScore}`} />
          ) : null}
        </View>
        {responsavel && <Text className="text-xs text-muted mb-2">{t("reports.protocol.responsible")}: {responsavel}</Text>}
        {hasResponses ? (
          detail.cars.domains.map((domain) => (
            <View key={domain.id}>
              <SectionRow label={domain.title} value={domain.scoreLabel} />
              {domain.observation && (
                <Text className="text-xs text-muted py-1 pl-2 italic">{domain.observation}</Text>
              )}
            </View>
          ))
        ) : (
          <EmptyProtocol />
        )}
      </View>
    );
  }

  if (tipo === "mabc2" && detail.mabc2) {
    const m = detail.mabc2;
    return (
      <View className="border border-outline rounded-lg bg-level2 p-4 mb-3">
        <View className="mb-3">
          <Text className="text-sm font-bold text-content">MABC-2 — {dateLabel}</Text>
          {m.evaluatorName && <Text className="text-xs text-muted mt-0.5">{t("reports.protocol.evaluator")}: {m.evaluatorName}</Text>}
          {m.ageGroupLabel && <Text className="text-xs text-muted">{t("reports.protocol.ageGroup")}: {m.ageGroupLabel}</Text>}
        </View>

        <View className="flex-row gap-3 mb-4">
          {(m.totalScore != null || hasFallbackScore) && (
            <View className="flex-1 bg-level1 border border-outline rounded-lg py-2 items-center">
              <Text className="text-[10px] text-muted">{t("reports.protocol.totalScore")}</Text>
              <Text className="text-base text-content font-bold">{m.totalScore ?? fallbackScore}</Text>
            </View>
          )}
          {(m.totalPercentile != null || hasFallbackPct) && (
            <View className="flex-1 bg-level1 border border-outline rounded-lg py-2 items-center">
              <Text className="text-[10px] text-muted">{t("reports.protocol.percentile")}</Text>
              <Text className="text-base text-content font-bold">{m.totalPercentile ?? fallbackPercentile}</Text>
            </View>
          )}
        </View>

        {m.components.map((comp, ci) => (
          <View key={ci} className="mb-4">
            <View className="flex-row items-center justify-between mb-2 pb-1.5 border-b border-outline">
              <Text className="text-sm font-bold text-content">{fmtComponentTitle(comp.title, t)}</Text>
              <View className="flex-row gap-2">
                {comp.categoryScore != null && (
                  <View className="bg-level1 border border-outline rounded-lg px-2.5 py-1 items-center">
                    <Text className="text-[9px] text-muted">{t("reports.protocol.standardScore")}</Text>
                    <Text className="text-xs text-content font-bold">{comp.categoryScore}</Text>
                  </View>
                )}
                {comp.categoryPercentile && (
                  <View className="bg-level1 border border-outline rounded-lg px-2.5 py-1 items-center">
                    <Text className="text-[9px] text-muted">{t("reports.protocol.percentile")}</Text>
                    <Text className="text-xs text-content font-bold">{comp.categoryPercentile}</Text>
                  </View>
                )}
              </View>
            </View>

            {comp.items.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between py-2 border-b border-outline/40">
                <Text className="text-[11px] text-content flex-1 mr-3" numberOfLines={2}>{item.name}</Text>
                <Text className="text-[11px] text-muted min-w-[40px] text-right">{item.rawScore}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return null;
}
