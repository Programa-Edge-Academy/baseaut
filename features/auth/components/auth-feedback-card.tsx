import { DefaultButton } from "@/components/default-button";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

/**
 * Supported feedback modes for auth-related success and status states.
 */
export type AuthFeedbackMode =
  | "accountCreated"
  | "codeValidated"
  | "passwordUpdated"
  | "pendingApproval";

/**
 * Props for the auth feedback card.
 */
interface AuthFeedbackCardProps {
  mode: AuthFeedbackMode;
}

/**
 * Displays a success or status card for auth flows.
 */
export function AuthFeedbackCard({ mode }: AuthFeedbackCardProps) {
  const { t } = useI18n();
  /**
   * Navigates back to the login screen.
   */
  const returnToLogin = () => {
    router.replace("/");
  };

  /**
   * Continues to the next step after code validation.
   */
  const continueUpdatePassword = () => {
    router.replace("/");
  };

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
      <View className="w-full max-w-[342px] items-center">
        {mode === "accountCreated" && (
          <>
            <Text className="text-header-3 text-content">
              {t("auth.feedback.accountCreated")}
            </Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-content text-center leading-5">
              {t("auth.feedback.accountCreatedMsg")}
            </Text>
          </>
        )}
        {mode === "codeValidated" && (
          <>
            <Text className="text-header-3 text-content">
              {t("auth.feedback.codeValidated")}
            </Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-content text-center leading-5">
              {t("auth.feedback.codeValidatedMsg")}
            </Text>
          </>
        )}
        {mode === "passwordUpdated" && (
          <>
            <Text className="text-header-3 text-content">
              {t("auth.feedback.passwordUpdated")}
            </Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-content text-center leading-5">
              {t("auth.feedback.passwordUpdatedMsg")}
            </Text>
          </>
        )}

        {mode === "pendingApproval" && (
          <>
            <Text className="text-header-3 text-content mb-7">
              {t("auth.feedback.pendingApprovalTitle")}
            </Text>
            <Text className="text-default-2 text-extra text-center leading-5">
              {t("auth.pendingApproval")}
            </Text>
          </>
        )}
      </View>

      <View className="w-full max-w-[342px] items-center mt-7">
        <DefaultButton
          label={
            mode === "codeValidated" || mode === "passwordUpdated"
              ? t("auth.feedback.continue")
              : t("auth.backToLogin")
          }
          onPress={
            mode === "codeValidated" ? continueUpdatePassword : returnToLogin
          }
          sizeClass="w-full h-11"
          className="rounded-[15px]"
        />
      </View>

      {mode === "codeValidated" ? (
        <View className="items-center mt-7">
          <Pressable onPress={returnToLogin}>
            <Text className="text-header-3 text-primary">{t("auth.backToLogin")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
