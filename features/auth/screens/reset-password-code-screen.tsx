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

  const handleSendInstructions = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, digite seu e-mail.");
      return;
    }

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
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-8 shadow-panelShadow border border-outline">
          
          {!isSent ? (
            <>
              <Text className="text-header-2 text-white mb-2">
                Redefinir senha
              </Text>
              <Text className="text-default-2 text-muted mb-8 text-center">
                Digite seu e-mail para receber as instruções de recuperação.
              </Text>

              <View className="w-full gap-7">
                <DefaultTextInput
                  placeholder="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <DefaultButton
                  className="w-full"
                  label={loading ? "Enviando..." : "Enviar instruções"}
                  onPress={handleSendInstructions}
                  disabled={loading}
                />
              </View>

              <Pressable 
                onPress={() => router.replace("/")} 
                className="mt-6"
              >
                <Text className="text-default-2 text-primary font-bold">
                  Voltar ao login
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="text-header-2 text-white mb-5">
                E-mail enviado!
              </Text>
              
              <Text className="text-default-2 text-muted mb-8 text-center leading-5">
                Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.
              </Text>

              <DefaultButton
                label="Voltar ao login"
                onPress={() => router.replace("/")}
                bgColorClass="bg-level1"
                className="border border-outline"
                shadowClass="shadow-none"
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/* import { DefaultButton } from "@/components/default-button";
import { DefaultTextInput } from "@/components/default-text-input";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { baseautLogoXml } from "@/assets/baseaut-logo";
import { supabase } from "@/lib/supabase";

export function ResetPasswordCodeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string>("");

  const handleResetPasswordCode = async () => {
    setError(null);
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const { error: recoverError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          // Supabase JS expects redirectTo at top-level for this method
          redirectTo: "baseaut://reset-password",
        },
      );

      if (recoverError) {
        setError(recoverError.message);
        Alert.alert("Erro ao recuperar senha", recoverError.message);
        return;
      }

      Alert.alert(
        "Sucesso",
        "Se esse email estiver cadastrado, você receberá um link para redefinir sua senha.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = () => {
    router.push("/reset-password" as never);
  };

  return (
    <View className="flex-1 items-center bg-level1 px-4 pt-10">
      <View className="w-full mt-12 pt-12 items-center">
        <SvgXml xml={baseautLogoXml} width={196} height={70} />
      </View>

      <View className="mt-10 w-full items-center">
        <View className="w-full max-w-[384px] items-center rounded-[15px] bg-level2 px-6 py-6 shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline">
          <Text className="mb-5 text-default-1 text-muted">
            Redefina sua senha
          </Text>

          <View className="w-full max-w-[342px] gap-7">
            <View className="w-full">
              <DefaultTextInput
                placeholder="Email"
                className="h-11 w-full rounded-[15px]"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text className="mt-1 text-sm text-red-400">{emailError}</Text>
              ) : null}
            </View>

            <View className="w-full flex-row items-center gap-3">
              <DefaultTextInput
                placeholder="Código de 6 dígitos"
                className="h-11 flex-1 rounded-[15px] w-[140px]"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              <DefaultButton
                label={loading ? "Enviando..." : "Enviar código"}
                onPress={handleResetPasswordCode}
                bgColorClass="bg-secondary"
                shadowClass="shadow-secondaryShadow"
                sizeClass="h-11 w-[140px]"
                className="rounded-[15px]"
                disabled={loading}
              />
            </View>
          </View>

          {error ? <Text className="mt-3 text-red-400">{error}</Text> : null}

          <View className="mt-7 w-full max-w-[342px] items-center">
            <DefaultButton
              label="Confirmar código"
              onPress={handleConfirmCode}
              sizeClass="w-full h-11"
              className="rounded-[15px]"
            />
          </View>

          <View className="mt-6 items-center">
            <Pressable onPress={() => router.replace("/" as never)}>
              <Text className="text-default-2 text-primary">
                Voltar ao login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
 */