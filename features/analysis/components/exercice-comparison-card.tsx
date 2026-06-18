import { colors } from "@/assets/colors";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, useWindowDimensions, View } from "react-native";

import AnalysisMaturityCard, { DevelopmentLevel } from "./analysis-maturity-card";
import ExerciseSelectionCard from "./exercise-selection-card";

const SIDE_MARGIN = 16;
const MAX_WIDTH = 600;

const LEVEL_MAP: Record<string, number> = {
    inicial: 1,
    intermediario: 2,
    maduro: 3,
};

export type ExerciseComparisonCardProps = {
    alunoId: string;
    p1Inicio?: string;
    p1Fim?: string;
    p2Inicio?: string;
    p2Fim?: string;
};

interface CombinedExerciseItem {
    exercise: string;
    previous: { status: DevelopmentLevel; label: string } | null;
    current: { status: DevelopmentLevel; label: string } | null;
    variacaoNivel: number;
}

interface RpcExerciciosItem {
    titulo: string;
    nivel_p1: string | null;
    nivel_p2: string | null;
}

function formatBadgeLabel(str: string | null): string {
    if (!str) return "Sem registro";
    const lower = str.toLowerCase();
    if (lower === "intermediario") return "Intermediário";
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function fixDateBoundaries(dateStr?: string, isEndOfDay = false): string | null {
    if (!dateStr) return null;
    
    if (dateStr.includes("T")) return dateStr;
    
    return isEndOfDay 
        ? `${dateStr}T23:59:59.999-03:00` 
        : `${dateStr}T00:00:00.000-03:00`;
}

function ExerciseComparisonCard({ alunoId, p1Inicio, p1Fim, p2Inicio, p2Fim }: ExerciseComparisonCardProps) {
    const { width: screenWidth } = useWindowDimensions();
    const [items, setItems] = useState<CombinedExerciseItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const width = Math.min(screenWidth - SIDE_MARGIN * 2, MAX_WIDTH);

    useEffect(() => {
        let isMounted = true;

        async function fetchComparisonData() {
            if (!alunoId) return;
            
            try {
                setLoading(true);
                setError(null);
                
                const payload = {
                    p_aluno_id: alunoId,
                    p_p1_inicio: fixDateBoundaries(p1Inicio, false),
                    p_p1_fim: fixDateBoundaries(p1Fim, true),
                    p_p2_inicio: fixDateBoundaries(p2Inicio, false),
                    p_p2_fim: fixDateBoundaries(p2Fim, true),
                };

                const { data, error: rpcError } = await supabase.rpc("rpc_comparar_desempenho_periodos", payload);

                if (rpcError) throw new Error(rpcError.message);

                if (!isMounted) return;

                let parsedData = data;
                if (typeof data === "string") {
                    try {
                        parsedData = data.trim() !== "" ? JSON.parse(data) : {};
                    } catch (parseError) {
                        parsedData = {}; 
                    }
                }

                if (!parsedData || !parsedData.exercicios) {
                    setItems([]);
                    setSelectedIndex(0);
                    return;
                }

                const rawData = (parsedData.exercicios || []) as RpcExerciciosItem[];
                
                const mappedItems: CombinedExerciseItem[] = rawData.map((item) => {
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

                setItems(mappedItems);
                setSelectedIndex(0);
            } catch (err: any) {
                if (isMounted) setError("Não foi possível carregar a comparação por exercício.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        
        fetchComparisonData();
        
        return () => {
            isMounted = false;
        };
    }, [alunoId, p1Inicio, p1Fim, p2Inicio, p2Fim]);

    const OPTIONS = useMemo(() => ["Todos", ...items.map((i) => i.exercise)], [items]);
    
    const filteredItems = useMemo(() => {
        if (selectedIndex === 0) return items;
        const selected = items[selectedIndex - 1];
        return selected ? [selected] : [];
    }, [items, selectedIndex]);

    return (
        <View style={{ width, alignSelf: "center" }} className="relative bg-level2 border border-outline rounded-2xl p-6">
            <Text className="text-white text-[20px] font-bold">Comparação por exercício</Text>
            
            <View style={{ marginTop: 24, marginBottom: 24 }}>
                <ExerciseSelectionCard options={OPTIONS} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
            </View>

            {/* Cabeçalho da Tabela */}
            <View className="mb-3 px-3 flex-row items-center">
                <View className="flex-[2]"><Text className="text-muted text-xs">Exercício</Text></View>
                <View className="flex-1 items-center"><Text className="text-muted text-xs">Período 1</Text></View>
                <View className="flex-1 items-center"><Text className="text-muted text-xs">Período 2</Text></View>
                <View className="flex-1 items-end"><Text className="text-muted text-xs">Variação</Text></View>
            </View>

            <View className="gap-3">
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : error ? (
                    <Text className="text-red-400 text-center py-4">{error}</Text>
                ) : items.length === 0 ? (
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