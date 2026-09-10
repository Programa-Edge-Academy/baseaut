import { useGlobalToast } from "@/components/global-toast";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useCallback } from "react";
import { Platform } from "react-native";

/** Address that receives user feedback about the app. */
export const SUPPORT_EMAIL = "suporte.baseaut@gmail.com";

/**
 * Opens the device's default mail app with a message addressed to the support
 * team, pre-filled with a subject and a body template that already carries the
 * app version and platform.
 *
 * @remarks
 * The mail app is reached through a plain `mailto:` link rather than a native
 * compose module, so the feature adds no native dependency and works on the APK
 * users already have installed.
 *
 * `Linking.canOpenURL` is deliberately not consulted first. From Android 11 on
 * it answers `false` for `mailto:` unless the app declares a matching
 * `<queries>` entry in its manifest, so gating on it would disable the feature
 * on every modern device. The call is simply attempted, and only a genuine
 * failure — no mail app installed — surfaces the fallback toast with the
 * address so the user can still reach the team.
 *
 * The version travels in the body because it is what tells the team whether a
 * report refers to a build where the problem was already fixed.
 */
export function useFeedbackEmail() {
  const { t } = useI18n();
  const { showToast } = useGlobalToast();

  /** Hands the composed message over to the default mail app. */
  const openFeedbackEmail = useCallback(async () => {
    const subject = t("feedback.email.subject");
    const body = t("feedback.email.body")
      .replace("{version}", Constants.expoConfig?.version ?? "?")
      .replace("{platform}", Platform.OS);

    const url =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(url);
    } catch {
      showToast({
        mode: "error",
        title: t("feedback.email.errorTitle"),
        description: t("feedback.email.errorMessage").replace(
          "{email}",
          SUPPORT_EMAIL,
        ),
      });
    }
  }, [t, showToast]);

  return { openFeedbackEmail };
}
