import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { ContinuationOptions } from "@/features/exercises/components/continuation-options";
import { SessionCompletion } from "@/features/exercises/components/session-completion";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

export function SessionCompletedStructuredContinuationScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-level1">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <Header variant="back" />

          <View className="left-6 top-[2%] w-[264px]">
            <PageHeader title="Sessão de Lucas" subtitle="Circuito 2 · Livre" />
          </View>

          {/* Cartão de Conclusão */}
          <View className="top-[5%] mx-5 rounded-2xl bg-level1 p-5 justify-center items-center">
            <SessionCompletion
              details={"Lucas · Circuito 1 · Estruturado"}
              className=""
              statusLabel="Realizadas"
              hasWarnings={false}
              // 1. Simulação da sua Fila (ex: sobraram 2 exercícios)
              unrealizedCount={2}
              onBackToStart={() => {
                console.log("Voltando para o início das sessões...");
                router.replace("/students");
              }}
              // 2. A LÓGICA DE CLIQUE
              onSelectContinuation={(id) => {
                if (id === "try_unrealized") {
                  // Pega a sua fila real (que deve vir da tela anterior)
                  const filaDePendentes = ["exercicio_id_1", "exercicio_id_4"];

                  console.log(
                    "Iniciando exercícios não realizados da fila:",
                    filaDePendentes,
                  );

                  // Manda o usuário de volta para a tela de rodar a sessão,
                  // passando a fila para o componente de sessão saber o que renderizar
                  router.push({
                    pathname: "/session/free", // Ajuste para a rota correta da sua sessão
                    params: {
                      // Mandamos a fila via parâmetro
                      queue: JSON.stringify(filaDePendentes),
                    },
                  });
                } else if (id === "repeat_exercise") {
                  console.log("Abrir modal de escolher repetição...");
                } else if (id === "do_other") {
                  console.log("Abrir biblioteca de exercícios...");
                }
              }}
              progress={"3/3"}
            />
          </View>

          {/* Opções de Continuação */}
          <View className="top-[8%] mx-5 rounded-2xl justify-center items-center">
            <ContinuationOptions
              unrealizedCount={8}
              onSelectOption={function (id: string): void {
                throw new Error("Function not implemented.");
              }}
              onCancel={function (): void {
                throw new Error("Function not implemented.");
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
