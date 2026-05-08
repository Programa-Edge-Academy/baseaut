import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { DefaultButton } from "@/components/default-button";
import { router } from "expo-router";

export type AuthFeedbackMode = "accountCreated" | "codeValidated" | "passwordUpdated";

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
    <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline gap-4">
      <Image
        source={require("../../../assets/images/success.png")}
        resizeMode="contain"
        />

      <View className="w-full max-w-[342px] items-center gap-2">
        {mode === "accountCreated" && (
          <>
            <Text className="text-default-1 text-white text-center">Conta criada com sucesso!</Text>
            <Text className="text-default-1 text-white text-center">Por favor, aguarde a aprovação da Coordenadora para liberar seu acesso.</Text>
          </>
        )}
        {mode === "codeValidated" && (
          <>
            <Text className="text-default-1 text-white text-center">Código validado com sucesso!</Text>
            <Text className="text-default-1 text-white text-center">Agora você pode redefinir sua senha e acessar sua conta.</Text>
          </>
        )}
        {mode === "passwordUpdated" && (
          <>
            <Text className="text-default-1 text-white text-center">Senha redefinida com sucesso!</Text>
            <Text className="text-default-1 text-white text-center">Agora você pode acessar sua conta com a sua nova senha.</Text>
          </>
        )}
      </View>

      {mode !== "accountCreated" && (mode === "passwordUpdated" || mode === "codeValidated") ?
        <View className="w-full max-w-[342px] items-center">
          <DefaultButton
            label={mode === "passwordUpdated" ? "Voltar ao login" : "Continuar"}
            onPress={mode === "passwordUpdated" ? returnToLogin : continueUpdatePassword}
            sizeClass="w-full h-11"
            className="rounded-[15px]"
          />
        </View> : null
      }

      {mode === "codeValidated" ?
        <View className="items-center">
          <Pressable onPress={returnToLogin}>
            <Text className="text-default-2 text-primary">Voltar ao login</Text>
          </Pressable>
        </View> : null
      }
    </View>
  );
}
