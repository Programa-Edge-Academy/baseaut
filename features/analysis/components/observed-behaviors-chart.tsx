import React, { useMemo, useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { colors } from "@/assets/colors";

export type BehaviorType = "stereotypy" | "eye_contact" | "engagement" | "escape" | "crisis";

export interface BehaviorRecord {
  id: string;
  behaviorType: BehaviorType;
  date: string; // Formato "AAAA-MM-DD"
  frequency: number;
}

export interface ObservedBehaviorsChartProps {
  records: BehaviorRecord[];
  startDate?: Date | null;
  endDate?: Date | null;
  hideShadow?: boolean;
}

export const BEHAVIOR_CONFIG: Record<
  BehaviorType,
  { label: string; legendLabel: string; color: string }
> = {
  stereotypy: {
    label: "Estereotipias",
    legendLabel: "Estereotipias",
    color: "#09CDDB", // Cyan
  },
  eye_contact: {
    label: "Contato\nvisual",
    legendLabel: "Contato visual",
    color: "#DBBF09", // Yellow
  },
  engagement: {
    label: "Engajamento",
    legendLabel: "Engajamento",
    color: "#34C759", // Green (Figma)
  },
  escape: {
    label: "Fuga",
    legendLabel: "Fuga",
    color: "#CB30E0", // Purple (Figma)
  },
  crisis: {
    label: "Crises",
    legendLabel: "Crises",
    color: "#FF383C", // Red (Figma)
  },
};

export function ObservedBehaviorsChart({
  records,
  startDate,
  endDate,
  hideShadow = false,
}: ObservedBehaviorsChartProps) {
  const [containerWidth, setContainerWidth] = useState<number>(340);

  // 1. Filtragem por data no período selecionado
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Usar a parte da data apenas (AAAA-MM-DD) para comparações mais limpas
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

  // 2. Agrupamento e acumulação de frequência por tipo de comportamento
  const aggregatedData = useMemo(() => {
    const counts: Record<BehaviorType, number> = {
      stereotypy: 0,
      eye_contact: 0,
      engagement: 0,
      escape: 0,
      crisis: 0,
    };

    filteredRecords.forEach((rec) => {
      if (counts[rec.behaviorType] !== undefined) {
        counts[rec.behaviorType] += rec.frequency;
      }
    });

    return counts;
  }, [filteredRecords]);

  // Total acumulado para verificar estado vazio (se for zero, o gráfico não aparece)
  const totalFrequency = useMemo(() => {
    return Object.values(aggregatedData).reduce((sum, val) => sum + val, 0);
  }, [aggregatedData]);

  // Se não houver dados, o gráfico de barras não é exibido
  if (filteredRecords.length === 0 || totalFrequency === 0) {
    return null;
  }

  // 3. Cálculo dinâmico do eixo Y (Frequência máxima do gráfico, com mínimo de 9 conforme o Figma)
  const maxFrequencia = Math.max(...Object.values(aggregatedData));
  const yMax = Math.max(9, maxFrequencia);

  // Determinar o intervalo das linhas horizontais no grid de plotagem (geralmente de 1 em 1 para máximo 9, ou proporcional)
  const step = Math.max(1, Math.ceil(yMax / 9));
  const yLines: number[] = [];
  for (let i = 0; i <= yMax; i += step) {
    yLines.push(i);
  }
  // Forçar a linha do valor máximo a aparecer no topo da grade
  if (yLines[yLines.length - 1] !== yMax) {
    yLines.push(yMax);
  }

  // Capturar largura física para responsividade
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  // Dimensões do gráfico SVG
  const chartHeight = 220; 
  const leftAxisWidth = 20; 
  const rightMargin = 10;
  
  // Largura útil disponível para plotagem
  const paddingX = 40; // 20px padding left + 20px padding right do card contêiner
  const innerWidth = containerWidth - paddingX;
  const leftMargin = leftAxisWidth + 10;
  const plotWidth = innerWidth - leftMargin - rightMargin;

  const gridHeight = 180;
  const gridBottomY = 195; // Posição Y da linha correspondente ao valor zero

  // Função para mapear o valor da frequência na coordenada Y correspondente no canvas SVG
  const getGridY = (value: number) => {
    return gridBottomY - (value / yMax) * gridHeight;
  };

  const behaviorKeys: BehaviorType[] = [
    "stereotypy",
    "eye_contact",
    "engagement",
    "escape",
    "crisis",
  ];

  // Cálculo de largura proporcional e centralização das barras
  const columnWidth = plotWidth / behaviorKeys.length;
  const barWidth = Math.min(35, Math.max(16, columnWidth - 12));

  return (
    <View
      onLayout={handleLayout}
      className={`w-full bg-level2 rounded-[20px] border border-outline p-5 flex-col gap-5 mt-5 ${hideShadow ? "" : "shadow-panelShadow"}`}
    >
      {/* Título e Legendas */}
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

      {/* Gráfico SVG */}
      <View style={{ height: chartHeight, width: "100%" }}>
        <Svg width={innerWidth} height={chartHeight} pointerEvents="none">
          {/* 1. Desenho das Barras Verticais (Camada inferior) */}
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

          {/* 2. Desenho das Linhas Pontilhadas do Grid (Camada intermediária - passa por cima das barras) */}
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

          {/* 3. Desenho dos Rótulos do Eixo Y (Camada superior - texto legível) */}
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

      {/* Rótulos do Eixo X (Categorias alinhadas usando Flexbox) */}
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

      {/* Descrição Textual do Figma */}
      <Text className="text-[#66758a] text-[12px] font-medium leading-[20px] mt-2">
        A frequência dos comportamentos observados ajuda a identificar padrões durante as sessões e
        apoiar decisões de acompanhamento.
      </Text>
    </View>
  );
}
