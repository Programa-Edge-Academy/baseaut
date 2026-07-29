import React, { useMemo, useState } from "react";
import { View, Text, LayoutChangeEvent, ScrollView } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import type { TranslationKey } from "@/features/settings/constants/translations";

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
  /**
   * "YYYY-MM-DD" local calendar date. Parsed by splitting the string rather
   * than via `new Date(string)`, which would interpret it as UTC midnight and
   * shift the date backwards in negative-offset timezones.
   */
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

/** Translation keys and colors for each behavior type. */
export const BEHAVIOR_CONFIG: Record<
  BehaviorType,
  { labelKey: TranslationKey; legendKey: TranslationKey; color: string }
> = {
  stereotypy: {
    labelKey: "analysis.behaviorChart.stereotypy.label",
    legendKey: "analysis.behaviorChart.stereotypy.legend",
    color: "#09CDDB",
  },
  eye_contact_people: {
    labelKey: "analysis.behaviorChart.eyePeople.label",
    legendKey: "analysis.behaviorChart.eyePeople.legend",
    color: "#DBBF09",
  },
  eye_contact_objects: {
    labelKey: "analysis.behaviorChart.eyeObjects.label",
    legendKey: "analysis.behaviorChart.eyeObjects.legend",
    color: "#A6900A",
  },
  engagement: {
    labelKey: "analysis.behaviorChart.engagement.label",
    legendKey: "analysis.behaviorChart.engagement.legend",
    color: "#34C759",
  },
  escape: {
    labelKey: "analysis.behaviorChart.escape.label",
    legendKey: "analysis.behaviorChart.escape.legend",
    color: "#CB30E0",
  },
  crisis: {
    labelKey: "analysis.behaviorChart.crisis.label",
    legendKey: "analysis.behaviorChart.crisis.legend",
    color: "#FF383C",
  },
  unfit: {
    labelKey: "analysis.behaviorChart.unfit.label",
    legendKey: "analysis.behaviorChart.unfit.legend",
    color: "#FF8A00",
  },
  preferred_activity: {
    labelKey: "analysis.behaviorChart.preferred.label",
    legendKey: "analysis.behaviorChart.preferred.legend",
    color: "#1E88E5",
  },
};

/**
 * Bar chart of accumulated observed-behavior frequencies over a date range, one
 * bar per behavior type. Each column keeps a minimum width; when the columns no
 * longer fit the card, the plot (bars plus category labels) scrolls
 * horizontally while the Y axis stays fixed.
 */
export function ObservedBehaviorsChart({
  records,
  startDate,
  endDate,
  hideShadow = false,
}: ObservedBehaviorsChartProps) {
  const { t } = useI18n();
  const [containerWidth, setContainerWidth] = useState<number>(340);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const [year, month, day] = rec.date.split("-").map(Number);
      const compDate = new Date(year, month - 1, day);

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
  const MIN_COLUMN_WIDTH = 64;

  const paddingX = 40;
  const innerWidth = containerWidth - paddingX;
  const leftMargin = leftAxisWidth + 10;
  const availablePlotWidth = innerWidth - leftMargin - rightMargin;

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

  const columnWidth = Math.max(
    availablePlotWidth / behaviorKeys.length,
    MIN_COLUMN_WIDTH,
  );
  const plotWidth = columnWidth * behaviorKeys.length;
  const plotSvgWidth = plotWidth + rightMargin;
  const barWidth = Math.min(35, Math.max(16, columnWidth - 12));

  return (
    <View
      onLayout={handleLayout}
      className={`w-full bg-level2 rounded-[20px] border border-outline p-5 flex-col gap-5 mt-5 ${hideShadow ? "" : "shadow-panelShadow"}`}
    >
      <View className="flex-col gap-3">
        <Text className="text-content font-bold" style={{ fontSize: 16 }}>
          {t("analysis.behaviorChart.title")}
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
                  {t(config.legendKey)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="flex-row w-full">
        <View style={{ width: leftMargin, height: chartHeight }}>
          <Svg width={leftMargin} height={chartHeight} pointerEvents="none">
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
        >
          <View style={{ width: plotSvgWidth }}>
            <Svg width={plotSvgWidth} height={chartHeight} pointerEvents="none">
              {behaviorKeys.map((key, index) => {
                const config = BEHAVIOR_CONFIG[key];
                const frequency = aggregatedData[key];
                const barHeight = (frequency / yMax) * gridHeight;
                const barX = index * columnWidth + (columnWidth - barWidth) / 2;
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
                    x1={0}
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke={colors.outline}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                );
              })}
            </Svg>

            <View className="flex-row" style={{ width: plotWidth }}>
              {behaviorKeys.map((key) => {
                const config = BEHAVIOR_CONFIG[key];
                const lines = t(config.labelKey).split("\n");

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
          </View>
        </ScrollView>
      </View>

      <Text className="text-[#66758a] text-[12px] font-medium leading-[20px] mt-2">
        {t("analysis.behaviorChart.note")}
      </Text>
    </View>
  );
}
