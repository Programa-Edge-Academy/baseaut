import { DefaultButton } from "@/components/default-button";
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
              Conta criada com sucesso!
            </Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-content text-center leading-5">
              Por favor, aguarde a aprovação da Coordenadora para liberar seu
              acesso.
            </Text>
          </>
        )}
        {mode === "codeValidated" && (
          <>
            <Text className="text-header-3 text-content">
              Código validado com sucesso!
            </Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-content text-center leading-5">
              Agora você pode redefinir sua senha e acessar sua conta.
            </Text>
          </>
        )}
        {mode === "passwordUpdated" && (
          <>
            <Text className="text-header-3 text-content">
              Senha redefinida com sucesso!
            </Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-content text-center leading-5">
              Agora você pode acessar sua conta com a sua nova senha.
            </Text>
          </>
        )}

        {mode === "pendingApproval" && (
          <>
            <Text className="text-header-3 text-content mb-7">
              Aprovação pendente
            </Text>
            <Text className="text-default-2 text-extra text-center leading-5">
              Seu cadastro ainda está aguardando aprovação.
            </Text>
          </>
        )}
      </View>

      <View className="w-full max-w-[342px] items-center mt-7">
        <DefaultButton
          label={
            mode === "codeValidated" || mode === "passwordUpdated"
              ? "Continuar"
              : "Voltar ao login"
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
            <Text className="text-header-3 text-primary">Voltar ao login</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
