import React, { useMemo, useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import Svg, { Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { colors } from "@/assets/colors";

/** A single exercise execution record plotted on the progress chart. */
export interface ExerciseProgressRecord {
  id: string;
  sessionId: string;
  /** Display date in "DD/MM/YYYY" format. */
  date: string;
  /** ISO or "YYYY-MM-DD" date used for sorting and filtering. */
  rawDate: string;
  executionStatus: "realizada" | "nao_realizada";
  developmentLevel?: "inicial" | "intermediario" | "maduro";
}

/** Props for {@link ExerciseProgressChart}. */
export interface ExerciseProgressChartProps {
  exerciseName: string;
  records: ExerciseProgressRecord[];
  startDate?: Date | null;
  endDate?: Date | null;
  hideShadow?: boolean;
}

/**
 * Renders a student's development-level progress over time for one exercise. The
 * chart fits the available width, distributing all points evenly without
 * horizontal scrolling.
 */
export function ExerciseProgressChart({
  exerciseName,
  records,
  startDate,
  endDate,
  hideShadow = false,
}: ExerciseProgressChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>(340);

  const filteredRecords = useMemo(() => {
    let filtered = records.filter((r) => r.executionStatus === "realizada" && !!r.developmentLevel);

    if (startDate) {
      filtered = filtered.filter((rec) => {
        const recordDate = new Date(rec.rawDate);
        const compDate = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const compStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        return compDate >= compStart;
      });
    }

    if (endDate) {
      filtered = filtered.filter((rec) => {
        const recordDate = new Date(rec.rawDate);
        const compDate = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const compEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return compDate <= compEnd;
      });
    }

    return filtered.sort((a, b) => {
      const timeA = new Date(a.rawDate).getTime();
      const timeB = new Date(b.rawDate).getTime();
      return timeA - timeB;
    });
  }, [records, startDate, endDate]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  const chartHeight = 200;
  const leftAxisWidth = 85;
  const cardPadding = 20;
  
  const availableWidth = containerWidth - leftAxisWidth - cardPadding * 2;

  const yMature = 30;
  const yIntermediate = 90;
  const yInitial = 150;

  const getLevelY = (level?: "inicial" | "intermediario" | "maduro") => {
    switch (level) {
      case "maduro":
        return yMature;
      case "intermediario":
        return yIntermediate;
      case "inicial":
      default:
        return yInitial;
    }
  };

  const getLevelColor = (level?: "inicial" | "intermediario" | "maduro") => {
    switch (level) {
      case "maduro":
        return colors.secondary;
      case "intermediario":
        return colors.extra;
      case "inicial":
      default:
        return colors.error;
    }
  };

  const N = filteredRecords.length;
  const plotWidth = availableWidth;
  const EDGE_PADDING = 10;
  const usableWidth = plotWidth - EDGE_PADDING * 2;
  const spacing = N > 1 ? usableWidth / (N - 1) : 0;

  const getXPosition = (index: number) => {
    if (N <= 1) {
      return plotWidth / 2;
    }
    return EDGE_PADDING + index * spacing;
  };

  return (
    <View
      onLayout={handleLayout}
      className={`w-full bg-level2 rounded-[20px] border border-outline p-5 flex-col gap-4 mt-5 ${hideShadow ? "" : "shadow-panelShadow"}`}
    >
      <View className="flex-col gap-1">
        <Text className="text-white font-bold" style={{ fontSize: 16 }}>
          Exercício selecionado: {exerciseName}
        </Text>
        
        <View className="flex-row items-center gap-4 mt-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.secondary }} />
            <Text className="text-xs text-muted font-medium">Maduro</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.extra }} />
            <Text className="text-xs text-muted font-medium">Intermediário</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.error }} />
            <Text className="text-xs text-muted font-medium">Inicial</Text>
          </View>
        </View>
      </View>

      <View className="flex-row w-full" style={{ height: chartHeight }}>
        
        <View style={{ width: leftAxisWidth, height: chartHeight }}>
          <Svg width={leftAxisWidth} height={chartHeight} pointerEvents="none">
            <SvgText
              x={10}
              y={yMature + 4}
              fill={colors.muted}
              fontSize={12}
              fontFamily="Inter-Medium"
            >
              Maduro
            </SvgText>

            <SvgText
              x={10}
              y={yIntermediate + 4}
              fill={colors.muted}
              fontSize={12}
              fontFamily="Inter-Medium"
            >
              Intermediário
            </SvgText>

            <SvgText
              x={10}
              y={yInitial + 4}
              fill={colors.muted}
              fontSize={12}
              fontFamily="Inter-Medium"
            >
              Inicial
            </SvgText>
          </Svg>
        </View>

        <View className="flex-1" style={{ height: chartHeight }}>
          <Svg width={plotWidth} height={chartHeight} pointerEvents="none">
            
              <Line
                x1={0}
                y1={yMature}
                x2={plotWidth + 10}
                y2={yMature}
                stroke={colors.outline}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Line
                x1={0}
                y1={yIntermediate}
                x2={plotWidth + 10}
                y2={yIntermediate}
                stroke={colors.outline}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Line
                x1={0}
                y1={yInitial}
                x2={plotWidth + 10}
                y2={yInitial}
                stroke={colors.outline}
                strokeWidth={1}
                strokeDasharray="4 4"
              />

              {filteredRecords.map((rec) => {
                const x = getXPosition(filteredRecords.indexOf(rec));
                const y = getLevelY(rec.developmentLevel);
                return (
                  <Line
                    key={`guide-${rec.id}`}
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={165}
                    stroke={colors.outline}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {filteredRecords.length > 1 &&
                filteredRecords.slice(0, -1).map((rec, index) => {
                  const nextRec = filteredRecords[index + 1];
                  const x1 = getXPosition(index);
                  const y1 = getLevelY(rec.developmentLevel);
                  const x2 = getXPosition(index + 1);
                  const y2 = getLevelY(nextRec.developmentLevel);
                  const color1 = getLevelColor(rec.developmentLevel);
                  const color2 = getLevelColor(nextRec.developmentLevel);

                  return (
                    <React.Fragment key={`line-seg-${rec.id}`}>
                      <Defs>
                        <LinearGradient
                          id={`line-grad-${rec.id}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          gradientUnits="userSpaceOnUse"
                        >
                          <Stop offset="0%" stopColor={color1} />
                          <Stop offset="100%" stopColor={color2} />
                        </LinearGradient>
                      </Defs>
                      <Line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={`url(#line-grad-${rec.id})`}
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    </React.Fragment>
                  );
                })}

              {filteredRecords.map((rec, index) => {
                const x = getXPosition(index);
                const y = getLevelY(rec.developmentLevel);
                const dotColor = getLevelColor(rec.developmentLevel);

                return (
                  <React.Fragment key={`point-group-${rec.id}`}>
                    <Circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill={dotColor}
                      stroke={colors.level2}
                      strokeWidth={2}
                    />

                    <SvgText
                      x={x}
                      y={178}
                      fill="#66758A"
                      fontSize={12}
                      fontFamily="Inter-Medium"
                      textAnchor="middle"
                    >
                      {index + 1}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
      </View>

      {filteredRecords.length > 0 && (
        <Text className="text-center text-xs font-bold text-muted mt-2">
          Sessão
        </Text>
      )}
    </View>
  );
}
