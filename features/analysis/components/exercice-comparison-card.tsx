import { colors } from "@/assets/colors";
import { AlertCircle } from "lucide-react-native";
import React, { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";

import AnalysisMaturityCard from "./analysis-maturity-card";
import ExerciseSelectionCard from "./exercise-selection-card";

const SIDE_MARGIN = 16;
const MAX_WIDTH = 600;

function ExerciseComparisonCard() {
    const { width: screenWidth } = useWindowDimensions();

    const width = Math.min(
        screenWidth - SIDE_MARGIN * 2,
        MAX_WIDTH
    );

    const items = [
        {
            exercise: "Escalada",
            previous: { status: "maduro" as const },
            current: { status: "maduro" as const },
        },
        {
            exercise: "Girar bambolê",
            previous: { status: "inicial" as const },
            current: { status: "intermediario" as const },
        },
        {
            exercise: "Equilíbrio na tábua",
            previous: { status: "intermediario" as const },
            current: { status: "inicial" as const },
        },
        {
            exercise: "Pular obstáculos",
            previous: { status: "inicial" as const },
            current: { status: "maduro" as const },
        },
    ];

    const OPTIONS = [
        "Todos",
        "Escalada",
        "Girar bambolê",
        "Equilíbrio na tábua",
        "Pular obstáculos",
    ];

    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const filteredItems =
        selectedIndex === 0
            ? items
            : items.filter(
                (item) => item.exercise === OPTIONS[selectedIndex]
            );

    return (
        <View
            style={{
                width,
                alignSelf: "center",
            }}
            className="relative bg-level1 border border-outline rounded-2xl p-6"
        >
            {/* Title */}
            <Text className="text-white text-[20px] font-bold">
                Comparação por exercício
            </Text>

            {/* Dropdown Overlay */}
            <View
                style={{
                    position: "absolute",
                    top: 68,
                    left: 24,
                    right: 24,
                    zIndex: 999,
                    elevation: 999,
                }}
            >
                <ExerciseSelectionCard
                    onSelect={(index) => setSelectedIndex(index)}
                />
            </View>

            {/* Space reserved for closed dropdown */}
            <View style={{ height: 72 }} />

            {/* Header */}
            <View className="mb-3 px-3 flex-row items-center top-4">

                <View className="flex-[2]">
                    <Text className="text-muted text-xs">
                        Exercício
                    </Text>
                </View>

                <View className="flex-1 items-center">
                    <Text className="text-muted text-xs">
                        Período 1
                    </Text>
                </View>

                <View className="flex-1 items-center">
                    <Text className="text-muted text-xs">
                        Período 2
                    </Text>
                </View>

                <View className="flex-1 items-end">
                    <Text className="text-muted text-xs">
                        Variação
                    </Text>
                </View>

            </View>

            {/* Rows */}
            <View className="gap-3">

                {filteredItems.map((item) => (
                    <AnalysisMaturityCard
                        key={item.exercise}
                        exercise={item.exercise}
                        previous={item.previous}
                        current={item.current}
                    />
                ))}

            </View>

            {/* Footer */}
            <View className="mt-5 flex-row items-start">

                <AlertCircle
                    size={22}
                    color={colors.muted}
                    strokeWidth={2}
                />

                <Text
                    className="text-muted text-xs ml-3"
                    style={{
                        flex: 1,
                        lineHeight: 20,
                    }}
                >
                    A variação indica a diferença de níveis no desempenho médio por
                    exercício entre os dois períodos selecionados.
                </Text>

            </View>

        </View>
    );
}

export default ExerciseComparisonCard;