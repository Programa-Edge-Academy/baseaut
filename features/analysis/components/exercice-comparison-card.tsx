import { colors } from "@/assets/colors";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
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

/** Per-exercise development levels for the two compared periods. */
export interface RpcExerciciosItem {
    titulo: string;
    nivel_p1: string | null;
    nivel_p2: string | null;
}

/** Props for {@link ExerciseComparisonCard}. */
export type ExerciseComparisonCardProps = {
    exercicios: RpcExerciciosItem[];
    hideDropdown?: boolean;
};

/** Normalized comparison row with parsed levels and computed variation. */
interface CombinedExerciseItem {
    exercise: string;
    previous: { status: DevelopmentLevel; label: string } | null;
    current: { status: DevelopmentLevel; label: string } | null;
    variacaoNivel: number;
}

/** Formats a development-level value into a localized badge label. */
function formatBadgeLabel(str: string | null, t: (key: TranslationKey) => string): string {
    if (!str) return t("analysis.noRecord");
    const lower = str.toLowerCase();
    if (lower === "inicial") return t("analysis.level.inicial");
    if (lower === "intermediario") return t("analysis.level.intermediario");
    if (lower === "maduro") return t("analysis.level.maduro");
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Compares per-exercise development levels between two periods, with an optional
 * dropdown to focus on a single exercise.
 */
function ExerciseComparisonCard({ exercicios, hideDropdown = false }: ExerciseComparisonCardProps) {
    const { t } = useI18n();
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

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
                exercise: item.titulo || t("analysis.unknownExercise"),
                previous: levelP1 ? { status: levelP1 as DevelopmentLevel, label: formatBadgeLabel(item.nivel_p1, t) } : null,
                current: levelP2 ? { status: levelP2 as DevelopmentLevel, label: formatBadgeLabel(item.nivel_p2, t) } : null,
                variacaoNivel: variacao,
            };
        });
    }, [exercicios, t]);

    const OPTIONS = useMemo(() => [t("common.allM"), ...items.map((i) => i.exercise)], [items, t]);
    
    const filteredItems = useMemo(() => {
        if (selectedIndex === 0) return items;
        const selected = items[selectedIndex - 1];
        return selected ? [selected] : [];
    }, [items, selectedIndex]);

    return (
        <View className="w-full relative bg-level2 border border-outline rounded-2xl p-6">
            <Text className="text-content text-[20px] font-bold">{t("analysis.compare.title")}</Text>
            
            {!hideDropdown && (
                <View style={{ marginTop: 24, marginBottom: 24 }}>
                    <ExerciseSelectionCard options={OPTIONS} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
                </View>
            )}

            <View className="mb-3 px-3 flex-row items-center">
                <View className="flex-[2]"><Text className="text-muted text-xs">{t("analysis.compare.exercise")}</Text></View>
                <View className="flex-1 items-center"><Text className="text-muted text-xs">{t("analysis.period1")}</Text></View>
                <View className="flex-1 items-center"><Text className="text-muted text-xs">{t("analysis.period2")}</Text></View>
                <View className="flex-1 items-end"><Text className="text-muted text-xs">{t("analysis.variation")}</Text></View>
            </View>

            <View className="gap-3">
                {items.length === 0 ? (
                    <Text className="text-muted text-center py-4">{t("analysis.compare.empty")}</Text>
                ) : (
                    filteredItems.map((item) => (
                        <AnalysisMaturityCard key={item.exercise} exercise={item.exercise} previous={item.previous} current={item.current} variacaoNivel={item.variacaoNivel} />
                    ))
                )}
            </View>

            <View className="mt-5 flex-row items-start">
                <AlertCircle size={22} color={colors.muted} />
                <Text className="text-muted text-xs ml-3 flex-1">{t("analysis.compare.footnote")}</Text>
            </View>
        </View>
    );
}

export default ExerciseComparisonCard;