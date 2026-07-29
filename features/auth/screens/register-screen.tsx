import { baseautLogoXml } from "@/assets/baseaut-logo";
import { RegisterForm } from "@/features/auth/components/register-form";
import React from "react";
import { View } from "react-native";

import { KeyboardAwareScrollView } from "@/components/keyboard-aware-scroll-view";
import { SvgXml } from "react-native-svg";

/**
 * Screen layout for the registration form.
 */
export function RegisterScreen() {
  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-level1"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1 items-center bg-level1 px-4 pt-10">
        <View className="w-full mt-12 pt-12 items-center">
          <SvgXml xml={baseautLogoXml} width={196} height={70} />
        </View>
        <View className="mt-10 w-full items-center">
          <RegisterForm />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
