import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "../../../assets/baseaut-logo";

import { LoginForm } from "../components/login-form";

export function LoginScreen() {
  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <LoginForm />
      </View>
    </View>
  );
}
