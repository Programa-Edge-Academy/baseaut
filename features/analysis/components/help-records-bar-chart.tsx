import React, { useState } from "react";
import { LayoutChangeEvent, ScrollView, Text, View } from "react-native";
import Svg, {
  Line,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { colors } from "@/assets/colors";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dados de uma sessão para o gráfico de registros de ajuda.
 */
export interface HelpSessionRecord {
  /** Identificador único da sessão */
  sessionId: string;
  /** Rótulo exibido no eixo X (ex: "1", "2", "3") */
  sessionLabel: string;
  /** Quantidade de registros de Ajuda Intrusiva nesta sessão */
  intrusiveCount: number;
  /** Quantidade de registros Autônomos nesta sessão */
  autonomousCount: number;
}

export interface HelpRecordsBarChartProps {
  /** Sessões em ordem cronológica */
  sessions: HelpSessionRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de design
// ─────────────────────────────────────────────────────────────────────────────

/** Cor da barra de Ajuda Intrusiva — ciano do tema */
const COLOR_INTRUSIVE = colors.verbal; // #09CDDB

/** Cor da barra Autônomo — amarelo do tema */
const COLOR_AUTONOMOUS = colors.extra; // #F0BD02

/** Altura fixa da área de plot das barras em px */
const CHART_HEIGHT = 190;

/** Largura reservada para o eixo Y à esquerda */
const Y_AXIS_WIDTH = 30;

/** Padding inferior dentro do SVG (para rótulos de sessão) */
const BOTTOM_PADDING = 28;

/** Padding superior dentro do SVG (folga acima da barra mais alta) */
const TOP_PADDING = 10;

/** Altura útil para as barras */
const BAR_AREA_HEIGHT = CHART_HEIGHT - BOTTOM_PADDING - TOP_PADDING;

/** Largura de cada barra individual */
const BAR_WIDTH = 18;

/** Espaço entre a barra intrusiva e a autônoma dentro do mesmo grupo */
const BAR_GAP = 4;

/** Espaço entre grupos de sessões diferentes */
const GROUP_SPACING = 24;

/** Largura total de um grupo (par de barras) */
const GROUP_WIDTH = BAR_WIDTH * 2 + BAR_GAP;

/** Largura de cada slot de sessão no eixo X */
const SESSION_SLOT_WIDTH = GROUP_WIDTH + GROUP_SPACING;

/** Padding horizontal inicial antes do primeiro grupo */
const X_START_PADDING = 15;

/** Padding interno do card (corresponde ao p-[15px] do contêiner) */
const CARD_PADDING = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o valor máximo do eixo Y arredondado para cima.
 * Garante um mínimo de 1 para evitar divisão por zero.
 */
function calcYMax(sessions: HelpSessionRecord[]): number {
  if (sessions.length === 0) return 1;
  const max = Math.max(
    ...sessions.map((s) => Math.max(s.intrusiveCount, s.autonomousCount)),
  );
  return Math.max(max, 1);
}

/**
 * Calcula os ticks do eixo Y de forma legível (máximo 6 linhas).
 */
function calcYTicks(yMax: number): number[] {
  const step = Math.ceil(yMax / 5);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) {
    ticks.push(v);
  }
  // Garante que o valor máximo esteja sempre incluído
  if (ticks[ticks.length - 1] < yMax) ticks.push(yMax);
  return ticks;
}

/**
 * Converte um valor de dado na coordenada Y dentro do SVG.
 * Valor zero resulta em altura mínima de 2px para permanecer visível.
 */
function valueToY(value: number, yMax: number): number {
  const minBarHeight = value > 0 ? 2 : 0;
  const barHeight =
    value > 0
      ? Math.max((value / yMax) * BAR_AREA_HEIGHT, minBarHeight)
      : 0;
  return CHART_HEIGHT - BOTTOM_PADDING - barHeight;
}

/**
 * Retorna a altura visual de uma barra.
 */
function valueToBarHeight(value: number, yMax: number): number {
  if (value <= 0) return 0;
  return Math.max((value / yMax) * BAR_AREA_HEIGHT, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gráfico de barras agrupadas que exibe, por sessão, a contagem de registros
 * de Ajuda Intrusiva e Autônomo em ordem cronológica.
 *
 * Segue o design definido no Figma (node 3389:135633).
 */
export function HelpRecordsBarChart({ sessions }: HelpRecordsBarChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>(340);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) setContainerWidth(width);
  };

  // Sem dados: não renderiza o card
  if (sessions.length === 0) return null;

  const yMax = calcYMax(sessions);
  const yTicks = calcYTicks(yMax);

  // Largura disponível para a área de barras (descontando eixo Y e padding do card)
  const availableWidth = containerWidth - Y_AXIS_WIDTH - CARD_PADDING * 2;
  const N = sessions.length;
  const dynamicSlotWidth = N > 0
    ? Math.max(SESSION_SLOT_WIDTH, (availableWidth - X_START_PADDING) / N)
    : SESSION_SLOT_WIDTH;

  // Largura total do SVG rolável
  const svgScrollWidth =
    X_START_PADDING +
    N * dynamicSlotWidth +
    GROUP_SPACING;

  // Coordenada Y de um tick no SVG
  const tickToSvgY = (tick: number) =>
    CHART_HEIGHT -
    BOTTOM_PADDING -
    (tick / yMax) * BAR_AREA_HEIGHT;

  return (
    <View
      onLayout={handleLayout}
      className="w-full bg-level2 rounded-[8px] border border-outline p-[15px] flex-col gap-[10px]"
    >
      {/* ── Título ─────────────────────────────────────────────────────────── */}
      <Text
        className="text-white font-bold"
        style={{ fontSize: 16, lineHeight: 20 }}
      >
        Registros de ajuda por sessão
      </Text>

      {/* ── Legenda ────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center gap-[10px]">
        {/* Ajuda Intrusiva */}
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

        {/* Autônomo */}
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

      {/* ── Área do gráfico ────────────────────────────────────────────────── */}
      <View className="flex-row" style={{ height: CHART_HEIGHT }}>

        {/* Eixo Y fixo à esquerda */}
        <View style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}>
          <Svg width={Y_AXIS_WIDTH} height={CHART_HEIGHT}>
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

        {/* Área rolável com barras + grade */}
        <View className="flex-1" style={{ height: CHART_HEIGHT }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Svg width={svgScrollWidth} height={CHART_HEIGHT}>

              {/* Linhas de grade horizontais (dashed) */}
              {yTicks.map((tick) => {
                const y = tickToSvgY(tick);
                return (
                  <Line
                    key={`grid-${tick}`}
                    x1={0}
                    y1={y}
                    x2={svgScrollWidth}
                    y2={y}
                    stroke={colors.outline}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Barras agrupadas + rótulo de sessão */}
              {sessions.map((session, index) => {
                const groupX = X_START_PADDING + index * dynamicSlotWidth;
                const xIntrusive = groupX;
                const xAutonomous = groupX + BAR_WIDTH + BAR_GAP;
                const groupCenterX = groupX + GROUP_WIDTH / 2;

                const intrusiveH = valueToBarHeight(session.intrusiveCount, yMax);
                const autonomousH = valueToBarHeight(session.autonomousCount, yMax);
                const intrusiveY = valueToY(session.intrusiveCount, yMax);
                const autonomousY = valueToY(session.autonomousCount, yMax);

                return (
                  <React.Fragment key={session.sessionId}>
                    {/* Barra Ajuda Intrusiva */}
                    {intrusiveH > 0 && (
                      <Rect
                        x={xIntrusive}
                        y={intrusiveY}
                        width={BAR_WIDTH}
                        height={intrusiveH}
                        fill={COLOR_INTRUSIVE}
                        rx={3}
                        ry={3}
                      />
                    )}

                    {/* Barra Autônomo */}
                    {autonomousH > 0 && (
                      <Rect
                        x={xAutonomous}
                        y={autonomousY}
                        width={BAR_WIDTH}
                        height={autonomousH}
                        fill={COLOR_AUTONOMOUS}
                        rx={3}
                        ry={3}
                      />
                    )}

                    {/* Rótulo de sessão no eixo X */}
                    <SvgText
                      x={groupCenterX}
                      y={CHART_HEIGHT - BOTTOM_PADDING + 16}
                      fill={colors.muted}
                      fontSize={12}
                      fontFamily="Inter-Medium"
                      textAnchor="middle"
                    >
                      {session.sessionLabel}
                    </SvgText>
                  </React.Fragment>
                );
              })}

            </Svg>
          </ScrollView>
        </View>
      </View>

      {/* Label "Sessão" centralizado abaixo da área rolável */}
      <Text
        className="text-center text-muted font-medium"
        style={{ fontSize: 12, lineHeight: 20 }}
      >
        Sessão
      </Text>

      {/* ── Texto explicativo ──────────────────────────────────────────────── */}
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
