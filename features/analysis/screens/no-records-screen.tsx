import { colors } from "@/assets/colors";
import { DefaultScrollView } from "@/components/default-scroll-view";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { AlertCircle, ChartNoAxesColumnIncreasingIcon, ChartNoAxesCombined, ClipboardListIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

/** Preset that selects the empty/error copy and iconography for {@link NoRecordsScreen}. */
export type NoRecordsScreenVariant = "sessions" | "protocol" | "help" | "behavior" | "loadRecords" | "loadEvolution" | "loadBehavior";

/** Props for {@link NoRecordsScreen}. */
export type NoRecordsScreenProps = {
  variant?: NoRecordsScreenVariant;
  studentName?: string;
  title?: string;
  message?: string;
  onPressBack?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

const VARIANT_CONFIG: Record<
  NoRecordsScreenVariant,
  {
    titleKey: TranslationKey;
    messageKey: TranslationKey;
    icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
    accentColor: string;
  }
> = {
  sessions: {
    titleKey: "analysis.noRecords.sessions.title",
    messageKey: "analysis.noRecords.sessions.message",
    icon: ChartNoAxesCombined,
    accentColor: colors.primary,
  },
  protocol: {
    titleKey: "analysis.noRecords.protocol.title",
    messageKey: "analysis.noRecords.protocol.message",
    icon: ClipboardListIcon,
    accentColor: "#F59E0B",
  },
  help: {
    titleKey: "analysis.noRecords.help.title",
    messageKey: "analysis.noRecords.help.message",
    icon: ChartNoAxesColumnIncreasingIcon,
    accentColor: "#34C759",
  },
  behavior: {
    titleKey: "analysis.noRecords.behavior.title",
    messageKey: "analysis.noRecords.behavior.message",
    icon: ChartNoAxesColumnIncreasingIcon,
    accentColor: "#8B5CF6",
  },
  loadRecords: {
    titleKey: "analysis.noRecords.loadRecords.title",
    messageKey: "analysis.noRecords.loadRecords.message",
    icon: AlertCircle,
    accentColor: "#EF4444",
  },
  loadEvolution: {
    titleKey: "analysis.noRecords.loadEvolution.title",
    messageKey: "analysis.noRecords.loadEvolution.message",
    icon: AlertCircle,
    accentColor: "#EF4444",
  },
  loadBehavior: {
    titleKey: "analysis.noRecords.loadBehavior.title",
    messageKey: "analysis.noRecords.loadBehavior.message",
    icon: AlertCircle,
    accentColor: "#EF4444",
  },
};

/**
 * Reusable empty/error state screen for analysis views, with preset copy and
 * icon per variant plus optional primary/secondary actions.
 */
export function NoRecordsScreen({
  variant = "sessions",
  studentName,
  title,
  message,
  onPressBack,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel,
  secondaryActionLabel,
}: NoRecordsScreenProps) {
  const { t } = useI18n();
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const resolvedStudentName = studentName ?? t("common.student");
  const resolvedPrimaryLabel = primaryActionLabel ?? t("common.back");

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="mx-5 mt-5">
        <PageHeader
          title={`${t("analysis.noRecords.header")} — ${resolvedStudentName}`}
          subtitle=""
        />
      </View>

      <DefaultScrollView
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View className="flex-1 items-center justify-center px-2 py-8">
          <View className="w-full rounded-[32px] border border-outline bg-level2 p-6">
            <View
              className="mb-5 items-center justify-center rounded-[24px] p-5"
              style={{ backgroundColor: `${config.accentColor}14` }}
            >
              <Icon size={56} color={config.accentColor} strokeWidth={2} />
            </View>

            <Text className="text-center text-[22px] font-bold text-content" style={{ fontFamily: "Inter-Bold" }}>
              {title ?? t(config.titleKey)}
            </Text>

            <Text className="mt-3 text-center text-[14px] leading-6 text-muted" style={{ fontFamily: "Inter-Medium" }}>
              {message ?? t(config.messageKey)}
            </Text>

            <View className="mt-6 gap-3">
              {onPrimaryAction ? (
                <Pressable
                  onPress={onPrimaryAction}
                  className="items-center rounded-2xl px-4 py-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-[14px] font-semibold text-content">{resolvedPrimaryLabel}</Text>
                </Pressable>
              ) : null}

              {secondaryActionLabel && onSecondaryAction ? (
                <Pressable
                  onPress={onSecondaryAction}
                  className="items-center rounded-2xl border border-outline bg-level3 px-4 py-3"
                >
                  <Text className="text-[14px] font-semibold text-content">{secondaryActionLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </DefaultScrollView>
    </View>
  );
}
