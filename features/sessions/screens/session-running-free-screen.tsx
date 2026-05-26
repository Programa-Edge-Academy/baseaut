import { colors } from "@/assets/colors";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "expo-router";
import { ChevronRight, Split } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const EXERCISES = [
  {
    id: "1",
    title: "Arremesso de bola",
    description: "Arremessar bola ao alvo",
  },
  {
    id: "2",
    title: "Empilhamento de cones",
    description: "Empilhar cones alternadamente",
  },
  {
    id: "3",
    title: "Escalada",
    description: "Escalar parede",
  },
];

export function SessionRunningFreeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-level1">

      <ScrollView>
        <View>

          <Header variant="back" />

          <View className="left-6 top-[2%] w-[264px]">
            <PageHeader title="Sessão de Lucas" subtitle="Circuito 2 · Livre" />
          </View>

          <View className="top-[5%] mx-5 rounded-2xl bg-level1 border border-primary p-5">
            {/* Seção header com texto e ícone */}
            <View className="flex-row items-center justify-between gap-4 pb-5 mb-5 border-b border-outline">
              <View className="flex-1 space-y-1">
                <Text className="text-white text-base font-medium leading-5">
                  Selecione o próximo exercício
                </Text>
                <Text className="text-muted text-sm font-medium leading-5">
                  Para atividades de engajamento, pressione o botão amarelo ao lado
                </Text>
              </View>

              <View className="w-10 h-10 rounded-full bg-extra/10 border border-extra justify-center items-center flex-shrink-0">
                <Split color={colors.extra} size={24} />
              </View>
            </View>

            {/* Lista de exercícios */}
            <View className="space-y-2">
              {EXERCISES.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  className="flex-row items-center justify-between rounded-2xl bg-level2 border border-outline px-5 py-3"
                  onPress={() => router.push("/exercises")}
                >
                  <View className="space-y-1">
                    <Text className="text-white text-base font-medium leading-5">
                      {exercise.title}
                    </Text>
                    <Text className="text-muted text-sm font-medium leading-5">
                      {exercise.description}
                    </Text>
                  </View>
                  <ChevronRight color={colors.muted} size={24} />
                </Pressable>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
