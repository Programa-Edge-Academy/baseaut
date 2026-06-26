import { colors } from "@/assets/colors";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    MinusCircle,
} from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/** Motor development level of an exercise. */
export type DevelopmentLevel =
    | "maduro"
    | "intermediario"
    | "inicial";

/** Props for {@link AnalysisMaturityCard}. */
export type AnalysisMaturityCardProps = {
    exercise: string;
    previous?: {
        label?: string;
        status: DevelopmentLevel;
    } | null;
    current?: {
        label?: string;
        status: DevelopmentLevel;
    } | null;
    variacaoNivel?: number | null;
    className?: string;
};

const levelStyles: Record<
    DevelopmentLevel,
    {
        backgroundColor: string;
        borderColor: string;
    }
> = {
    maduro: { backgroundColor: "#153615", borderColor: "#34C759" },
    intermediario: { backgroundColor: "#2F2807", borderColor: colors.extra },
    inicial: { backgroundColor: "#3A1620", borderColor: colors.error },
};

/** Returns the badge label for a level, falling back to its default name. */
function getBadgeLabel(label: string | undefined, status: DevelopmentLevel) {
    return (
        label ??
        (status === "maduro"
            ? "Maduro"
            : status === "intermediario"
                ? "Intermediário"
                : "Inicial")
    );
}

/** Resolves the icon, color, and label describing the level change. */
function getChangeData(
    exerciseName: string,
    variacaoNivel: number | undefined | null
) {

    if (variacaoNivel === undefined || variacaoNivel === null) {
        return {
            Icon: MinusCircle,
            iconColor: colors.muted,
            textColor: colors.muted,
            value: "-",
        };
    }

    if (variacaoNivel > 0) {
        return {
            Icon: ArrowUpCircle,
            iconColor: colors.secondary,
            textColor: colors.secondary,
            value: `+${variacaoNivel}`,
        };
    }

    if (variacaoNivel < 0) {
        return {
            Icon: ArrowDownCircle,
            iconColor: colors.error,
            textColor: colors.error,
            value: `${variacaoNivel}`,
        };
    }

    return {
        Icon: MinusCircle,
        iconColor: colors.muted,
        textColor: colors.muted,
        value: "0",
    };
}

/**
 * Comparison row for one exercise showing its previous and current development
 * level badges and the level change between periods.
 */
export function AnalysisMaturityCard({
    exercise,
    previous,
    current,
    variacaoNivel,
    className,
}: AnalysisMaturityCardProps) {

    const changeData = getChangeData(exercise, variacaoNivel);

    const ChangeIcon = changeData.Icon;

    return (
        <View
            className={`w-full rounded-xl border border-outline bg-level2 py-4 px-3 mt-3 ${className ?? ""}`}
        >
            <View className="flex-row items-center">

                <View style={{ flex: 2.2, paddingRight: 8 }}>
                    <Text numberOfLines={2} className="text-white text-xs font-medium">
                        {exercise}
                    </Text>
                </View>

                <View style={{ flex: 1.4, alignItems: "center", paddingHorizontal: 6 }}>
                    {previous?.status ? (
                        <View
                            className="rounded-sm border px-2 py-1"
                            style={{
                                backgroundColor: levelStyles[previous.status].backgroundColor,
                                borderColor: levelStyles[previous.status].borderColor,
                            }}
                        >
                            <Text numberOfLines={1} className="text-[10px] text-white">
                                {getBadgeLabel(previous.label, previous.status)}
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-muted text-xs font-medium">-</Text>
                    )}
                </View>

                <View style={{ flex: 1.4, alignItems: "center", paddingHorizontal: 6 }}>
                    {current?.status ? (
                        <View
                            className="rounded-sm border px-2 py-1"
                            style={{
                                backgroundColor: levelStyles[current.status].backgroundColor,
                                borderColor: levelStyles[current.status].borderColor,
                            }}
                        >
                            <Text numberOfLines={1} className="text-[10px] text-white">
                                {getBadgeLabel(current.label, current.status)}
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-muted text-xs font-medium">-</Text>
                    )}
                </View>

                <View style={{ flex: 0.8, alignItems: "flex-end" }}>
                    <View className="flex-row items-center">
                        <ChangeIcon size={18} color={changeData.iconColor} />
                        <Text className="ml-1 text-sm font-medium" style={{ color: changeData.textColor }}>
                            {changeData.value}
                        </Text>
                    </View>
                </View>

            </View>
        </View>
    );
}

export default AnalysisMaturityCard;