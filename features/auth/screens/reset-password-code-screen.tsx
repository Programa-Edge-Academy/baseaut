import { baseautLogoXml } from "@/assets/baseaut-logo";
import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendInstructions = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "baseaut://reset-password",
      });

      if (error) throw error;

      setIsSent(true);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow border border-outline">
          
          {!isSent ? (
            <>
              <Text className="text-header-3 text-white mb-5">
                Redefinir senha
              </Text>

              <View className="w-full gap-7">
                <View className="w-full gap-1">
                  <Text className="text-default-2 text-muted">E-mail</Text>
                  <DefaultTextInput
                    placeholder="Seu e-mail"
                    value={email}
                    maxLength={254}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({});
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="h-11 w-full rounded-[15px]"
                    outLineBorderClass={errors.email ? "border-error" : "border-outline"}
                  />
                  {errors.email && (
                    <Text className="text-default-3 text-error">{errors.email}</Text>
                  )}
                </View>

                <DefaultButton
                  className="w-full h-11"
                  label={loading ? "Enviando..." : "Enviar solicitação"}
                  onPress={handleSendInstructions}
                  disabled={loading}
                />
              </View>

              <Pressable 
                onPress={() => router.replace("/")} 
                className="mt-7"
              >
                <Text className="text-header-3 text-primary">
                  Voltar ao login
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="text-header-3 text-white mb-5">
                E-mail enviado!
              </Text>
              
              <Text className="text-default-2 text-muted mb-7 text-center leading-5">
                Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.
              </Text>

              <DefaultButton
                label="Voltar ao login"
                onPress={() => router.replace("/")}
                className="h-11 w-full"
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}