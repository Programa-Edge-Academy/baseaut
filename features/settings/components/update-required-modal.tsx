import { AppModal } from "@/components/app-modal";
import { DefaultButton } from "@/components/default-button";
import type { AppRelease } from "@/features/settings/hooks/use-app-version";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import * as Linking from "expo-linking";
import { Download } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

/** Props for {@link UpdateRequiredModal}. */
type UpdateRequiredModalProps = {
  /** Version of the build currently running on the device. */
  installedVersion: string;
  /** Newest published release the user has to move to. */
  release: AppRelease;
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
 * Blocking dialog shown when the installed build is older than the newest
 * published release. It states both versions, lists what the new release
 * brings, and opens the Google Drive folder the APK is distributed from.
 *
 * @remarks
 * The dialog is deliberately inescapable: there is no close affordance, the
 * backdrop ignores presses, and `onRequestClose` swallows the Android back
 * button, so the app stays unusable until the user updates. That is the whole
 * point — the app ships as an APK outside any store, so nothing else stops a
 * clinic from recording sessions on a build whose bugs were already fixed.
 *
 * The download folder comes from the release row rather than a constant: a
 * blocked user is by definition running an old build, so a link compiled into
 * the app could never be corrected if the folder moved.
 */
export function UpdateRequiredModal({
  installedVersion,
  release,
}: UpdateRequiredModalProps) {
  const { t } = useI18n();
  const colors = useThemeColors();
  const [linkFailed, setLinkFailed] = useState(false);

  const handleDownload = async () => {
    if (!release.url_download) return;
    try {
      await Linking.openURL(release.url_download);
    } catch {
      setLinkFailed(true);
    }
  };

  return (
    <AppModal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/70 px-4">
        <View className="w-[92%] max-w-[400px] gap-5 rounded-xl border border-outline bg-level2 p-6">
          <View className="flex-row items-center gap-4">
            <Download size={30} color={colors.primary} />
            <Text className="flex-1 text-header-2 text-content">
              {t("update.required.title")}
            </Text>
          </View>

          <Text className="text-default-1 leading-5 text-muted">
            {t("update.required.message")}
          </Text>

          <View className="gap-1 rounded-2xl border border-outline bg-level1 p-4">
            <View className="flex-row justify-between gap-3">
              <Text className="text-default-2 text-muted">
                {t("update.required.installed")}
              </Text>
              <Text className="text-default-2 text-content">{installedVersion}</Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="text-default-2 text-muted">
                {t("update.required.latest")}
              </Text>
              <Text className="text-default-2 text-primary">{release.versao}</Text>
            </View>
          </View>

          {release.notas.length > 0 && (
            <View className="gap-2">
              <Text className="text-header-3 text-content">
                {t("update.required.changes")}
              </Text>
              <ScrollView
                className="max-h-40"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {release.notas.map((nota, index) => (
                  <NoteItem key={`${release.versao}-${index}`} text={nota} />
                ))}
              </ScrollView>
            </View>
          )}

          {release.url_download ? (
            <DefaultButton
              label={t("update.required.action")}
              onPress={handleDownload}
              sizeClass="w-full h-11"
              className="rounded-[12px]"
            />
          ) : (
            <Text className="text-center text-default-2 text-extra">
              {t("update.required.noLink")}
            </Text>
          )}

          {linkFailed && (
            <Text className="text-center text-default-3 text-error">
              {t("update.required.linkError")}
            </Text>
          )}
        </View>
      </View>
    </AppModal>
  );
}
