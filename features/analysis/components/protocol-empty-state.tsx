import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { ClipboardList } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export type ProtocolEmptyStateProps = {
  title?: string;
  description?: string;
};

/** Shared empty state used when a student has no record for a protocol. */
export function ProtocolEmptyState({
  title,
  description,
}: ProtocolEmptyStateProps) {
  const { t } = useI18n();
  const displayTitle = title ?? t("analysis.emptyProtocol.title");
  const displayDescription = description ?? t("analysis.emptyProtocol.desc");
  return (
    <View className="mx-8 mt-8 items-center justify-center rounded-2xl border border-outline bg-level1 px-6 py-16">
      <ClipboardList size={56} color={colors.muted} strokeWidth={1.5} />
      <Text className="mt-6 text-center text-default-2 font-medium text-content">
        {displayTitle}
      </Text>
      <Text className="mt-2 text-center text-sm text-muted">{displayDescription}</Text>
    </View>
  );
}
