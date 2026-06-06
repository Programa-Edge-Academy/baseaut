import { colors } from "@/assets/colors";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react-native";
import React from "react";
import { Text, useWindowDimensions, View } from "react-native";

export type DevelopmentLevel = "maduro" | "intermediario" | "inicial";

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

const levelStyles: Record<DevelopmentLevel, { backgroundColor: string; borderColor: string }> = {
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

function getBadgeLabel(label: string | undefined, status: DevelopmentLevel) {
    return label ?? (status === "maduro"
        ? "Maduro"
        : status === "intermediario"
            ? "Intermediário"
            : "Inicial");
}

function getChangeData(previousStatus: DevelopmentLevel, currentStatus: DevelopmentLevel) {
    const delta = statusOrder[currentStatus] - statusOrder[previousStatus];

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

const SIDE_MARGIN = 16;
const TOP_MARGIN = 16;

export function AnalysisMaturityCard({
    exercise,
    previous,
    current,
    className,
}: AnalysisMaturityCardProps) {
    const { width: windowWidth } = useWindowDimensions();
    const changeData = getChangeData(previous.status, current.status);
    const ChangeIcon = changeData.Icon;
    const width = Math.max(0, windowWidth - SIDE_MARGIN * 2);

    return (
        <View
            className={`h-12 rounded-lg border border-outline bg-level2 ${className ?? ""}`}
            style={{
                width,
                marginHorizontal: SIDE_MARGIN,
                marginTop: TOP_MARGIN,
                alignSelf: "center",
            }}
        >
            <View className="flex-row items-center justify-between h-full px-4">
                <Text className="text-[12px] font-normal text-white">{exercise}</Text>


                <View
                    className="rounded-sm border px-2 py-1"
                    style={{
                        backgroundColor: levelStyles[previous.status].backgroundColor,
                        borderColor: levelStyles[previous.status].borderColor,
                    }}
                >
                    <Text className="text-[10px] font-normal text-white text-center">
                        {getBadgeLabel(previous.label, previous.status)}
                    </Text>
                </View>
                <View
                    className="rounded-sm border px-2 py-1"
                    style={{
                        backgroundColor: levelStyles[current.status].backgroundColor,
                        borderColor: levelStyles[current.status].borderColor,
                    }}
                >
                    <Text className="text-[10px] font-normal text-white text-center">
                        {getBadgeLabel(current.label, current.status)}
                    </Text>
                </View>

                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 items-center justify-center" style={{ borderColor: changeData.iconColor }}>
                        <ChangeIcon size={16} color={changeData.iconColor} strokeWidth={2} />
                    </View>
                    <Text className="text-sm font-medium" style={{ color: changeData.textColor }}>
                        {changeData.value}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default AnalysisMaturityCard;
