import { colors } from "@/assets/colors";
import React, { useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import Svg, {
  Line,
  Rect,
  Text as SvgText,
} from "react-native-svg";

/** Per-session data point for the help-records bar chart. */
export interface HelpSessionRecord {
  /** Unique session identifier. */
  sessionId: string;
  /** Label shown on the X axis (e.g. "1", "2", "3"). */
  sessionLabel: string;
  /** Number of intrusive-help records in this session. */
  intrusiveCount: number;
  /** Number of autonomous records in this session. */
  autonomousCount: number;
}

/** Props for {@link HelpRecordsBarChart}. */
export interface HelpRecordsBarChartProps {
  /** Sessions in chronological order. */
  sessions: HelpSessionRecord[];
}

/** Intrusive-help bar color (theme cyan). */
const COLOR_INTRUSIVE = colors.verbal;

/** Autonomous bar color (theme yellow). */
const COLOR_AUTONOMOUS = colors.extra;

/** Fixed height of the bar plot area in px. */
const CHART_HEIGHT = 190;

/** Width reserved for the left Y axis. */
const Y_AXIS_WIDTH = 30;

/** Bottom padding inside the SVG (for session labels). */
const BOTTOM_PADDING = 28;

/** Top padding inside the SVG (headroom above the tallest bar). */
const TOP_PADDING = 10;

/** Usable height for the bars. */
const BAR_AREA_HEIGHT = CHART_HEIGHT - BOTTOM_PADDING - TOP_PADDING;

/** Card inner padding (matches the container's p-[15px]). */
const CARD_PADDING = 15;

/**
 * Returns the rounded-up Y-axis maximum, with a floor of 1 to avoid division by
 * zero.
 */
function calcYMax(sessions: HelpSessionRecord[]): number {
  if (sessions.length === 0) return 1;
  const max = Math.max(
    ...sessions.map((s) => Math.max(s.intrusiveCount, s.autonomousCount)),
  );
  return Math.max(max, 1);
}

/** Computes readable Y-axis ticks (up to ~6 lines). */
function calcYTicks(yMax: number): number[] {
  const step = Math.ceil(yMax / 5);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) {
    ticks.push(v);
  }
  if (ticks[ticks.length - 1] < yMax) ticks.push(yMax);
  return ticks;
}

/**
 * Converts a data value to its Y coordinate inside the SVG. A zero value yields
 * a 0 height (no bar drawn).
 */
function valueToY(value: number, yMax: number): number {
  const minBarHeight = value > 0 ? 2 : 0;
  const barHeight =
    value > 0
      ? Math.max((value / yMax) * BAR_AREA_HEIGHT, minBarHeight)
      : 0;
  return CHART_HEIGHT - BOTTOM_PADDING - barHeight;
}

/** Returns the visual height of a bar for a value. */
function valueToBarHeight(value: number, yMax: number): number {
  if (value <= 0) return 0;
  return Math.max((value / yMax) * BAR_AREA_HEIGHT, 2);
}

/**
 * Grouped bar chart showing, per session in chronological order, the count of
 * intrusive-help and autonomous records.
 */
export function HelpRecordsBarChart({ sessions }: HelpRecordsBarChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>(340);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) setContainerWidth(width);
  };

  if (sessions.length === 0) return null;

  const yMax = calcYMax(sessions);
  const yTicks = calcYTicks(yMax);

  const availableWidth = containerWidth - Y_AXIS_WIDTH - CARD_PADDING * 2;
  const N = sessions.length;

  const X_START_PADDING = 15;
  const X_END_PADDING = X_START_PADDING;

  const baseBarWidth = 18;
  const baseBarGap = 4;
  const baseGroupWidth = baseBarWidth * 2 + baseBarGap;

  const usableWidth = availableWidth - X_START_PADDING - X_END_PADDING;
  const slotWidth = N > 0 ? usableWidth / N : usableWidth;

  const needsReduction = baseGroupWidth + 6 > slotWidth;

  let groupWidth = baseGroupWidth;
  let barWidth = baseBarWidth;
  let barGap = baseBarGap;

  if (needsReduction && slotWidth > 0) {
    groupWidth = slotWidth * 0.80;
    barGap = Math.max(1, groupWidth * 0.15);
    barWidth = Math.max(2, (groupWidth - barGap) / 2);
    groupWidth = barWidth * 2 + barGap;
  }

  const svgWidth = availableWidth;

  const labelFontSize = slotWidth < 25 ? Math.max(8, Math.round(slotWidth * 0.5)) : 12;

  let labelStep = 1;
  if (N > 7) {
    if (N <= 14) {
      labelStep = 2;
    } else if (N <= 35) {
      labelStep = 5;
    } else if (N <= 70) {
      labelStep = 10;
    } else {
      labelStep = Math.ceil(N / 7);
    }
  }

  const tickToSvgY = (tick: number) =>
    CHART_HEIGHT -
    BOTTOM_PADDING -
    (tick / yMax) * BAR_AREA_HEIGHT;

  return (
    <View
      onLayout={handleLayout}
      className="w-full bg-level2 rounded-[8px] border border-outline p-[15px] flex-col gap-[10px]"
    >
      <Text
        className="text-white font-bold"
        style={{ fontSize: 16, lineHeight: 20 }}
      >
        Registros de ajuda por sessão
      </Text>

      <View className="flex-row items-center gap-[10px]">
        <View className="flex-row items-center gap-[6px]">
          <View
            className="w-[10px] h-[10px] rounded-full"
            style={{ backgroundColor: COLOR_INTRUSIVE }}
          />
          <Text
            className="text-muted font-medium"
            style={{ fontSize: 11, lineHeight: 20 }}
          >
            Ajuda Intrusiva
          </Text>
        </View>

        <View className="flex-row items-center gap-[6px]">
          <View
            className="w-[10px] h-[10px] rounded-full"
            style={{ backgroundColor: COLOR_AUTONOMOUS }}
          />
          <Text
            className="text-muted font-medium"
            style={{ fontSize: 11, lineHeight: 20 }}
          >
            Autônomo
          </Text>
        </View>
      </View>

      <View className="flex-row" style={{ height: CHART_HEIGHT }}>

        <View style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}>
          <Svg width={Y_AXIS_WIDTH} height={CHART_HEIGHT} pointerEvents="none">
            {yTicks.map((tick) => (
              <SvgText
                key={`ytick-${tick}`}
                x={Y_AXIS_WIDTH - 4}
                y={tickToSvgY(tick) + 4}
                fill={colors.muted}
                fontSize={10}
                fontFamily="Inter-Medium"
                textAnchor="end"
              >
                {tick}
              </SvgText>
            ))}
          </Svg>
        </View>

        <View className="flex-1" style={{ height: CHART_HEIGHT }}>
          <Svg width={svgWidth} height={CHART_HEIGHT} pointerEvents="none">

            {yTicks.map((tick) => {
              const y = tickToSvgY(tick);
              return (
                <Line
                  key={`grid-${tick}`}
                  x1={0}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke={colors.outline}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}

            {sessions.map((session, index) => {
              const groupX = X_START_PADDING + index * slotWidth + (slotWidth - groupWidth) / 2;
              const xIntrusive = groupX;
              const xAutonomous = groupX + barWidth + barGap;
              const groupCenterX = groupX + groupWidth / 2;

              const intrusiveH = valueToBarHeight(session.intrusiveCount, yMax);
              const autonomousH = valueToBarHeight(session.autonomousCount, yMax);
              const intrusiveY = valueToY(session.intrusiveCount, yMax);
              const autonomousY = valueToY(session.autonomousCount, yMax);

              const num = index + 1;
              const shouldShowLabel = (N - num) % labelStep === 0;

              return (
                <React.Fragment key={session.sessionId}>
                  {intrusiveH > 0 && (
                    <Rect
                      x={xIntrusive}
                      y={intrusiveY}
                      width={barWidth}
                      height={intrusiveH}
                      fill={COLOR_INTRUSIVE}
                      rx={3}
                      ry={3}
                    />
                  )}

                  {autonomousH > 0 && (
                    <Rect
                      x={xAutonomous}
                      y={autonomousY}
                      width={barWidth}
                      height={autonomousH}
                      fill={COLOR_AUTONOMOUS}
                      rx={3}
                      ry={3}
                    />
                  )}

                  {shouldShowLabel && (
                    <SvgText
                      x={groupCenterX}
                      y={CHART_HEIGHT - BOTTOM_PADDING + 16}
                      fill={colors.muted}
                      fontSize={labelFontSize}
                      fontFamily="Inter-Medium"
                      textAnchor="middle"
                    >
                      {session.sessionLabel}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}

          </Svg>
        </View>
      </View>

      <Text
        className="text-center text-muted font-medium"
        style={{ fontSize: 12, lineHeight: 20 }}
      >
        Sessão
      </Text>

      <Text
        className="text-muted font-medium"
        style={{ fontSize: 12, lineHeight: 20 }}
      >
        A redução de Ajuda Intrusiva e o aumento de registros Autônomos indicam
        evolução na autonomia do aluno.
      </Text>
    </View>
  );
}
