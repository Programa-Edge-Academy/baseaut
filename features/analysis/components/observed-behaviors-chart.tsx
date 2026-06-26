import React, { useMemo, useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { colors } from "@/assets/colors";

/** A charted behavior category. */
export type BehaviorType =
  | "stereotypy"
  | "eye_contact_people"
  | "eye_contact_objects"
  | "engagement"
  | "escape"
  | "crisis"
  | "unfit"
  | "preferred_activity";

/** A single observed-behavior record for a given date. */
export interface BehaviorRecord {
  id: string;
  behaviorType: BehaviorType;
  /** "YYYY-MM-DD" date. */
  date: string;
  frequency: number;
}

/** Props for {@link ObservedBehaviorsChart}. */
export interface ObservedBehaviorsChartProps {
  records: BehaviorRecord[];
  startDate?: Date | null;
  endDate?: Date | null;
  hideShadow?: boolean;
}

/** Display labels and colors for each behavior type. */
export const BEHAVIOR_CONFIG: Record<
  BehaviorType,
  { label: string; legendLabel: string; color: string }
> = {
  stereotypy: {
    label: "Estereotipias",
    legendLabel: "Estereotipias",
    color: "#09CDDB",
  },
  eye_contact_people: {
    label: "Contato\nvisual\n(Pessoas)",
    legendLabel: "Contato visual (Pessoas)",
    color: "#DBBF09",
  },
  eye_contact_objects: {
    label: "Contato\nvisual\n(Objetos)",
    legendLabel: "Contato visual (Objetos)",
    color: "#A6900A",
  },
  engagement: {
    label: "Engajamento",
    legendLabel: "Engajamento",
    color: "#34C759",
  },
  escape: {
    label: "Fuga",
    legendLabel: "Fuga",
    color: "#CB30E0",
  },
  crisis: {
    label: "Crises",
    legendLabel: "Crises",
    color: "#FF383C",
  },
  unfit: {
    label: "Comporta-\nmentos\ninaptos",
    legendLabel: "Comportamentos inaptos",
    color: "#FF8A00",
  },
  preferred_activity: {
    label: "Atividades\npreferenciais",
    legendLabel: "Atividades preferenciais",
    color: "#1E88E5",
  },
};

/**
 * Bar chart of accumulated observed-behavior frequencies over a date range, one
 * bar per behavior type.
 */
export function ObservedBehaviorsChart({
  records,
  startDate,
  endDate,
  hideShadow = false,
}: ObservedBehaviorsChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>(340);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const recDate = new Date(rec.date);
      const compDate = new Date(recDate.getFullYear(), recDate.getMonth(), recDate.getDate());

      if (startDate) {
        const compStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        if (compDate < compStart) return false;
      }

      if (endDate) {
        const compEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        if (compDate > compEnd) return false;
      }

      return true;
    });
  }, [records, startDate, endDate]);

  const aggregatedData = useMemo(() => {
    const counts: Record<BehaviorType, number> = {
      stereotypy: 0,
      eye_contact_people: 0,
      eye_contact_objects: 0,
      engagement: 0,
      escape: 0,
      crisis: 0,
      unfit: 0,
      preferred_activity: 0,
    };

    filteredRecords.forEach((rec) => {
      if (counts[rec.behaviorType] !== undefined) {
        counts[rec.behaviorType] += rec.frequency;
      }
    });

    return counts;
  }, [filteredRecords]);

  const totalFrequency = useMemo(() => {
    return Object.values(aggregatedData).reduce((sum, val) => sum + val, 0);
  }, [aggregatedData]);

  if (filteredRecords.length === 0 || totalFrequency === 0) {
    return null;
  }

  const maxFrequencia = Math.max(...Object.values(aggregatedData));
  const yMax = Math.max(9, maxFrequencia);

  const step = Math.max(1, Math.ceil(yMax / 9));
  const yLines: number[] = [];
  for (let i = 0; i <= yMax; i += step) {
    yLines.push(i);
  }
  if (yLines[yLines.length - 1] !== yMax) {
    yLines.push(yMax);
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  const chartHeight = 220; 
  const leftAxisWidth = 20; 
  const rightMargin = 10;
  
  const paddingX = 40;
  const innerWidth = containerWidth - paddingX;
  const leftMargin = leftAxisWidth + 10;
  const plotWidth = innerWidth - leftMargin - rightMargin;

  const gridHeight = 180;
  const gridBottomY = 195;

  const getGridY = (value: number) => {
    return gridBottomY - (value / yMax) * gridHeight;
  };

  const behaviorKeys: BehaviorType[] = [
    "stereotypy",
    "eye_contact_people",
    "eye_contact_objects",
    "engagement",
    "escape",
    "crisis",
    "unfit",
    "preferred_activity",
  ];

  const columnWidth = plotWidth / behaviorKeys.length;
  const barWidth = Math.min(35, Math.max(16, columnWidth - 12));

  return (
    <View
      onLayout={handleLayout}
      className={`w-full bg-level2 rounded-[20px] border border-outline p-5 flex-col gap-5 mt-5 ${hideShadow ? "" : "shadow-panelShadow"}`}
    >
      <View className="flex-col gap-3">
        <Text className="text-white font-bold" style={{ fontSize: 16 }}>
          Frequência de comportamentos observados
        </Text>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
          {behaviorKeys.map((key) => {
            const config = BEHAVIOR_CONFIG[key];
            return (
              <View key={`legend-${key}`} className="flex-row items-center gap-1.5">
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <Text className="text-[10px] text-muted font-medium">
                  {config.legendLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: chartHeight, width: "100%" }}>
        <Svg width={innerWidth} height={chartHeight} pointerEvents="none">
          {behaviorKeys.map((key, index) => {
            const config = BEHAVIOR_CONFIG[key];
            const frequency = aggregatedData[key];
            const barHeight = (frequency / yMax) * gridHeight;
            const barX = leftMargin + index * columnWidth + (columnWidth - barWidth) / 2;
            const barY = gridBottomY - barHeight;

            if (frequency === 0) return null;

            return (
              <Rect
                key={`bar-${key}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={config.color}
              />
            );
          })}

          {yLines.map((val) => {
            const y = getGridY(val);
            return (
              <Line
                key={`grid-line-${val}`}
                x1={leftMargin}
                y1={y}
                x2={innerWidth - rightMargin}
                y2={y}
                stroke={colors.outline}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })}

          {yLines.map((val) => {
            const y = getGridY(val);
            return (
              <SvgText
                key={`axis-label-${val}`}
                x={leftAxisWidth}
                y={y + 4}
                fill={colors.muted}
                fontSize={12}
                fontFamily="Inter-Medium"
                textAnchor="end"
              >
                {val}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      <View className="flex-row w-full" style={{ paddingLeft: leftMargin }}>
        {behaviorKeys.map((key) => {
          const config = BEHAVIOR_CONFIG[key];
          const lines = config.label.split("\n");

          return (
            <View
              key={`label-${key}`}
              style={{ width: columnWidth }}
              className="items-center justify-start px-0.5"
            >
              {lines.map((line, idx) => (
                <Text
                  key={`${key}-lbl-line-${idx}`}
                  className="text-muted text-[10px] font-medium text-center leading-[14px]"
                >
                  {line}
                </Text>
              ))}
            </View>
          );
        })}
      </View>

      <Text className="text-[#66758a] text-[12px] font-medium leading-[20px] mt-2">
        A frequência dos comportamentos observados ajuda a identificar padrões durante as sessões e
        apoiar decisões de acompanhamento.
      </Text>
    </View>
  );
}
