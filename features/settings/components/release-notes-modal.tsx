import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import type { AppRelease } from "@/features/settings/hooks/use-app-version";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { Sparkles } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";

/** Props for {@link ReleaseNotesModal}. */
type ReleaseNotesModalProps = {
  /** Release whose changes are being announced. */
  release: AppRelease;
  /** Marks the release as seen so it is not announced again. */
  onAcknowledge: () => void;
};

/** A single change item rendered as a bullet. */
function NoteItem({ text }: { text: string }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-default-2 text-muted">{"•"}</Text>
      <Text className="flex-1 text-default-2 text-muted">{text}</Text>
    </View>
  );
}

/**
 * Dialog announcing what changed, shown the first time the app opens on a
 * version this device has not run before.
 *
 * @remarks
 * The notes come straight from the `versoes_app` row and are shown as written,
 * following the same rule as seeded form content: the stored value is authored
 * once by the team and is never rewritten at display time.
 *
 * Dismissing is what marks the version as seen, so a user who closes the app
 * before acknowledging still gets the notes on the next launch.
 */
export function ReleaseNotesModal({
  release,
  onAcknowledge,
}: ReleaseNotesModalProps) {
  const { t } = useI18n();
  const colors = useThemeColors();

  return (
    <AppModal
      visible
      transparent
      animationType="fade"
      onRequestClose={onAcknowledge}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <View className="w-[92%] max-w-[400px] gap-5 rounded-xl border border-outline bg-level2 p-6">
          <View className="flex-row items-center gap-4">
            <Sparkles size={30} color={colors.secondary} />
            <View className="flex-1">
              <Text className="text-header-2 text-content">
                {t("update.notes.title")}
              </Text>
              <Text className="text-default-3 text-muted">{release.versao}</Text>
            </View>
          </View>

          <Text className="text-default-1 leading-5 text-muted">
            {t("update.notes.subtitle")}
          </Text>

          <ScrollView
            className="max-h-64"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {release.notas.map((nota, index) => (
              <NoteItem key={`${release.versao}-${index}`} text={nota} />
            ))}
          </ScrollView>

          <DefaultButton
            label={t("update.notes.action")}
            onPress={onAcknowledge}
            sizeClass="w-full h-11"
            className="rounded-[12px]"
          />
        </View>
      </View>
    </AppModal>
  );
}
