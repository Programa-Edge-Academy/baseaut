import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { DefaultButton } from "@/components/default-button";
import { router } from "expo-router";

export type AuthFeedbackMode = "accountCreated" | "codeValidated" | "passwordUpdated" | "pendingApproval";

interface AuthFeedbackCardProps {
  mode: AuthFeedbackMode;
}

export function AuthFeedbackCard({ mode }: AuthFeedbackCardProps) {
  const returnToLogin = () => {
    router.replace("/");
  };

  const continueUpdatePassword = () => {
    router.replace("/");
  };

  return (
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">

      <View className="w-full max-w-[342px] items-center">
        {mode === "accountCreated" && (
          <>
            <Text className="text-header-3 text-white">Conta criada com sucesso!</Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-white text-center leading-5">Por favor, aguarde a aprovação da Coordenadora para liberar seu acesso.</Text>
          </>
        )}
        {mode === "codeValidated" && (
          <>
            <Text className="text-header-3 text-white">Código validado com sucesso!</Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
              />
            <Text className="text-default-2 text-white text-center leading-5">Agora você pode redefinir sua senha e acessar sua conta.</Text>
          </>
        )}
        {mode === "passwordUpdated" && (
          <>
            <Text className="text-header-3 text-white">Senha redefinida com sucesso!</Text>
            <Image
              className="my-7"
              source={require("../../../assets/images/success.png")}
              resizeMode="contain"
            />
            <Text className="text-default-2 text-white text-center leading-5">Agora você pode acessar sua conta com a sua nova senha.</Text>
          </>
        )}

        {mode === "pendingApproval" && (
          <>
            <Text className="text-header-3 text-white mb-7">Aprovação pendente</Text>
            <Text className="text-default-2 text-extra text-center leading-5">Seu cadastro ainda está aguardando aprovação.</Text>
          </>
        )}
      </View>

      <View className="w-full max-w-[342px] items-center mt-7">
        <DefaultButton
          label={(mode === "codeValidated" || mode === "passwordUpdated") ? "Continuar" : "Voltar ao login"}
          onPress={mode === "codeValidated" ? continueUpdatePassword : returnToLogin}
          sizeClass="w-full h-11"
          className="rounded-[15px]"
        />
      </View>

      {mode === "codeValidated" ?
        <View className="items-center mt-7">
          <Pressable onPress={returnToLogin}>
            <Text className="text-header-3 text-primary">Voltar ao login</Text>
          </Pressable>
        </View> : null
      }
    </View>
  );
}
