import { colors } from "@/assets/colors";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    MinusCircle,
} from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export type DevelopmentLevel =
    | "maduro"
    | "intermediario"
    | "inicial";

export type AnalysisMaturityCardProps = {
    exercise: string;
    previous: {
        label?: string;
        status: DevelopmentLevel;
    };
    current: {
        label?: string;
        status: DevelopmentLevel;
    };
    className?: string;
};

const levelStyles: Record<
    DevelopmentLevel,
    {
        backgroundColor: string;
        borderColor: string;
    }
> = {
    maduro: {
        backgroundColor: "#153615",
        borderColor: "#34C759",
    },
    intermediario: {
        backgroundColor: "#2F2807",
        borderColor: colors.extra,
    },
    inicial: {
        backgroundColor: "#3A1620",
        borderColor: colors.error,
    },
};

const statusOrder: Record<DevelopmentLevel, number> = {
    inicial: 1,
    intermediario: 2,
    maduro: 3,
};

function getBadgeLabel(
    label: string | undefined,
    status: DevelopmentLevel
) {
    return (
        label ??
        (status === "maduro"
            ? "Maduro"
            : status === "intermediario"
                ? "Intermediário"
                : "Inicial")
    );
}

function getChangeData(
    previousStatus: DevelopmentLevel,
    currentStatus: DevelopmentLevel
) {
    const delta =
        statusOrder[currentStatus] -
        statusOrder[previousStatus];

    if (delta > 0) {
        return {
            Icon: ArrowUpCircle,
            iconColor: colors.secondary,
            textColor: colors.secondary,
            value: `+${delta}`,
        };
    }

    if (delta < 0) {
        return {
            Icon: ArrowDownCircle,
            iconColor: colors.error,
            textColor: colors.error,
            value: `${delta}`,
        };
    }

    return {
        Icon: MinusCircle,
        iconColor: colors.muted,
        textColor: colors.muted,
        value: "0",
    };
}

export function AnalysisMaturityCard({
    exercise,
    previous,
    current,
    className,
}: AnalysisMaturityCardProps) {
    const changeData = getChangeData(
        previous.status,
        current.status
    );

    const ChangeIcon = changeData.Icon;

    return (
        <View
            className={`w-full rounded-xl border border-outline bg-level2 py-4 px-3 mt-3 ${className ?? ""}`}
        >
            <View className="flex-row items-center">

                {/* Exercício */}
                <View
                    style={{
                        flex: 2.2,
                        paddingRight: 8,
                    }}
                >
                    <Text
                        numberOfLines={2}
                        className="text-white text-xs font-medium"
                    >
                        {exercise}
                    </Text>
                </View>

                {/* Período 1 */}
                <View
                    style={{
                        flex: 1.4,
                        alignItems: "center",
                    }}
                >
                    <View
                        className="rounded-sm border px-2 py-1"
                        style={{
                            backgroundColor:
                                levelStyles[previous.status]
                                    .backgroundColor,
                            borderColor:
                                levelStyles[previous.status]
                                    .borderColor,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            className="text-[10px] text-white"
                        >
                            {getBadgeLabel(
                                previous.label,
                                previous.status
                            )}
                        </Text>
                    </View>
                </View>

                {/* Período 2 */}
                <View
                    style={{
                        flex: 1.4,
                        alignItems: "center",
                    }}
                >
                    <View
                        className="rounded-sm border px-2 py-1"
                        style={{
                            backgroundColor:
                                levelStyles[current.status]
                                    .backgroundColor,
                            borderColor:
                                levelStyles[current.status]
                                    .borderColor,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            className="text-[10px] text-white"
                        >
                            {getBadgeLabel(
                                current.label,
                                current.status
                            )}
                        </Text>
                    </View>
                </View>

                {/* Variação */}
                <View
                    style={{
                        flex: 0.8,
                        alignItems: "flex-end",
                    }}
                >
                    <View className="flex-row items-center">
                        <ChangeIcon
                            size={18}
                            color={changeData.iconColor}
                        />

                        <Text
                            className="ml-1 text-sm font-medium"
                            style={{
                                color: changeData.textColor,
                            }}
                        >
                            {changeData.value}
                        </Text>
                    </View>
                </View>

            </View>
        </View>
    );
}

export default AnalysisMaturityCard;