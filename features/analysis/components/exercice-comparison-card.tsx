import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import AnalysisMaturityCard, { DevelopmentLevel } from "./analysis-maturity-card";
import ExerciseSelectionCard from "./exercise-selection-card";

const LEVEL_MAP: Record<string, number> = {
    inicial: 1,
    intermediario: 2,
    maduro: 3,
};

export interface RpcExerciciosItem {
    titulo: string;
    nivel_p1: string | null;
    nivel_p2: string | null;
}

export type ExerciseComparisonCardProps = {
    exercicios: RpcExerciciosItem[];
    hideDropdown?: boolean;
};

interface CombinedExerciseItem {
    exercise: string;
    previous: { status: DevelopmentLevel; label: string } | null;
    current: { status: DevelopmentLevel; label: string } | null;
    variacaoNivel: number;
}

function formatBadgeLabel(str: string | null): string {
    if (!str) return "Sem registro";
    const lower = str.toLowerCase();
    if (lower === "intermediario") return "Intermediário";
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function ExerciseComparisonCard({ exercicios, hideDropdown = false }: ExerciseComparisonCardProps) {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    // Reset selection when database data changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [exercicios]);

    const items = useMemo<CombinedExerciseItem[]>(() => {
        const rawData = (exercicios || []) as RpcExerciciosItem[];
        
        return rawData.map((item) => {
            const levelP1 = item.nivel_p1 ? item.nivel_p1.toLowerCase() : null;
            const levelP2 = item.nivel_p2 ? item.nivel_p2.toLowerCase() : null;
            
            const n1 = levelP1 ? LEVEL_MAP[levelP1] : null;
            const n2 = levelP2 ? LEVEL_MAP[levelP2] : null;
            
            let variacao = 0;
            if (n1 !== null && n2 !== null) {
                variacao = n2 - n1;
            }

            return {
                exercise: item.titulo || "Exercício Desconhecido",
                previous: levelP1 ? { status: levelP1 as DevelopmentLevel, label: formatBadgeLabel(item.nivel_p1) } : null,
                current: levelP2 ? { status: levelP2 as DevelopmentLevel, label: formatBadgeLabel(item.nivel_p2) } : null,
                variacaoNivel: variacao,
            };
        });
    }, [exercicios]);

    const OPTIONS = useMemo(() => ["Todos", ...items.map((i) => i.exercise)], [items]);
    
    const filteredItems = useMemo(() => {
        if (selectedIndex === 0) return items;
        const selected = items[selectedIndex - 1];
        return selected ? [selected] : [];
    }, [items, selectedIndex]);

    return (
        <View className="w-full relative bg-level2 border border-outline rounded-2xl p-6">
            <Text className="text-white text-[20px] font-bold">Comparação por exercício</Text>
            
            {!hideDropdown && (
                <View style={{ marginTop: 24, marginBottom: 24 }}>
                    <ExerciseSelectionCard options={OPTIONS} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
                </View>
            )}

            {/* Cabeçalho da Tabela */}
            <View className="mb-3 px-3 flex-row items-center">
                <View className="flex-[2]"><Text className="text-muted text-xs">Exercício</Text></View>
                <View className="flex-1 items-center"><Text className="text-muted text-xs">Período 1</Text></View>
                <View className="flex-1 items-center"><Text className="text-muted text-xs">Período 2</Text></View>
                <View className="flex-1 items-end"><Text className="text-muted text-xs">Variação</Text></View>
            </View>

            <View className="gap-3">
                {items.length === 0 ? (
                    <Text className="text-muted text-center py-4">Não há exercícios com níveis registrados para comparar nos períodos selecionados.</Text>
                ) : (
                    filteredItems.map((item) => (
                        <AnalysisMaturityCard key={item.exercise} exercise={item.exercise} previous={item.previous} current={item.current} variacaoNivel={item.variacaoNivel} />
                    ))
                )}
            </View>

            <View className="mt-5 flex-row items-start">
                <AlertCircle size={22} color={colors.muted} />
                <Text className="text-muted text-xs ml-3 flex-1">A variação indica a diferença de níveis no desempenho médio por exercício entre os dois períodos selecionados.</Text>
            </View>
        </View>
    );
}

export default ExerciseComparisonCard;