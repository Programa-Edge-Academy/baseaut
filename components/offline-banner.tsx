import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { useOutboxStatus } from "@/lib/offline/use-outbox-status";
import { CloudUpload, TriangleAlert, WifiOff } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/**
 * Thin strip under the header that explains the offline state: no connection,
 * records waiting to be sent, or records Supabase rejected. Renders nothing
 * when online with an empty queue.
 */
export function OfflineBanner() {
  const { pending, failed, online } = useOutboxStatus();
  const colors = useThemeColors();
  const { t } = useI18n();

  if (online && pending === 0 && failed === 0) return null;

  if (failed > 0) {
    return (
      <View className="w-full flex-row items-center justify-center bg-error/10 px-4 py-2">
        <TriangleAlert color={colors.error} size={16} />
        <Text className="text-error text-default-3 ml-2">
          {t("offline.failed").replace("{count}", String(failed))}
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full flex-row items-center justify-center bg-extra/10 px-4 py-2">
      {online ? (
        <CloudUpload color={colors.extra} size={16} />
      ) : (
        <WifiOff color={colors.extra} size={16} />
      )}
      <Text className="text-extra text-default-3 ml-2">
        {online
          ? t("offline.pending").replace("{count}", String(pending))
          : pending > 0
            ? `${t("offline.noConnection")} ${t("offline.pending").replace("{count}", String(pending))}`
            : t("offline.noConnection")}
      </Text>
    </View>
  );
}
