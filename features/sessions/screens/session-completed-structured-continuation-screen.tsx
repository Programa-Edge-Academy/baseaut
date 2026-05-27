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
                            onContinue={function (): void {
                                throw new Error("Function not implemented.");
                            }}
                            onBackToStart={function (): void {
                                throw new Error("Function not implemented.");
                            }}
                            progress={"3/3"}
                        />
                    </View>

                    {/* Opções de Continuação */}
                    <View className="top-[8%] mx-5 rounded-2xl justify-center items-center">
                        <ContinuationOptions
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