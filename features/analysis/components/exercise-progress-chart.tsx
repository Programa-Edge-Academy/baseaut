import React, { useMemo, useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import Svg, { Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { colors } from "@/assets/colors";

/**
 * Interface que representa um registro individual de execução de exercício.
 * Todas as propriedades foram traduzidas para o inglês conforme solicitação.
 */
export interface ExerciseProgressRecord {
  id: string;
  sessionId: string;
  date: string; // Formato de exibição: "DD/MM/AAAA"
  rawDate: string; // Data ISO ou formato "AAAA-MM-DD" para ordenação e filtros
  executionStatus: "realizada" | "nao_realizada";
  developmentLevel?: "inicial" | "intermediario" | "maduro";
}

/**
 * Propriedades aceitas pelo componente do gráfico temporal de progresso.
 */
export interface ExerciseProgressChartProps {
  exerciseName: string;
  records: ExerciseProgressRecord[];
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Componente que renderiza o gráfico temporal de desempenho do aluno em um exercício específico.
 * O gráfico se adapta ao espaço disponível, distribuindo todos os pontos uniformemente
 * na largura do card sem necessidade de rolagem horizontal.
 */
export function ExerciseProgressChart({
  exerciseName,
  records,
  startDate,
  endDate,
}: ExerciseProgressChartProps) {
  // Estado para armazenar a largura do contêiner obtida dinamicamente via evento onLayout
  const [containerWidth, setContainerWidth] = useState<number>(340);

  // Bloco 1: Filtragem e ordenação cronológica (crescente) dos registros de exercícios
  const filteredRecords = useMemo(() => {
    // Filtra apenas execuções realizadas e que possuam um nível de desenvolvimento clínico registrado
    let filtered = records.filter((r) => r.executionStatus === "realizada" && !!r.developmentLevel);

    // Filtra pela data de início (startDate), caso tenha sido selecionada
    if (startDate) {
      filtered = filtered.filter((rec) => {
        const recordDate = new Date(rec.rawDate);
        const compDate = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const compStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        return compDate >= compStart;
      });
    }

    // Filtra pela data de fim (endDate), caso tenha sido selecionada
    if (endDate) {
      filtered = filtered.filter((rec) => {
        const recordDate = new Date(rec.rawDate);
        const compDate = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const compEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return compDate <= compEnd;
      });
    }

    // Ordena os registros cronologicamente (da sessão mais antiga para a mais recente)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.rawDate).getTime();
      const timeB = new Date(b.rawDate).getTime();
      return timeA - timeB;
    });
  }, [records, startDate, endDate]);

  // Bloco 2: Captura a largura física do card para recalcular a responsividade e preenchimento
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  // Bloco 3: Constantes de dimensões e mapeamento de coordenadas do gráfico
  const chartHeight = 200;      // Altura fixa do canvas SVG do gráfico
  const leftAxisWidth = 85;     // Largura fixa reservada para os rótulos do Eixo Y à esquerda
  const cardPadding = 20;       // Margem interna lateral aplicada no contêiner do card
  
  // Calcula a largura líquida disponível para plotar as sessões na tela
  const availableWidth = containerWidth - leftAxisWidth - cardPadding * 2;

  // Coordenadas Y correspondentes a cada nível de desenvolvimento clínico no gráfico
  const yMature = 30;
  const yIntermediate = 90;
  const yInitial = 150;

  // Função auxiliar para retornar a coordenada Y baseada no nível clínico
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

  // Função auxiliar para retornar a cor correspondente a cada nível clínico definido no theme colors
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

  // Bloco 4: Cálculo do espaçamento adaptativo — distribui pontos uniformemente no espaço disponível
  const N = filteredRecords.length;
  // plotWidth = largura total do SVG, fixada na largura disponível do container
  const plotWidth = availableWidth;
  // Margem interna horizontal: garante que o primeiro e último ponto não sejam cortados pela borda do SVG
  const EDGE_PADDING = 10;
  // Distribui os N pontos uniformemente dentro de availableWidth, respeitando as margens laterais
  const usableWidth = plotWidth - EDGE_PADDING * 2;
  const spacing = N > 1 ? usableWidth / (N - 1) : 0;

  // Função auxiliar para retornar a posição X de cada ponto dentro da largura fixa
  const getXPosition = (index: number) => {
    if (N <= 1) {
      return plotWidth / 2; // Centraliza o ponto se houver apenas 1 registro no período
    }
    return EDGE_PADDING + index * spacing;
  };

  return (
    <View
      onLayout={handleLayout}
      className="w-full bg-level2 rounded-[20px] border border-outline p-5 shadow-panelShadow flex-col gap-4 mt-5"
    >
      {/* Bloco 5: Cabeçalho com título fixado em 16px e legenda horizontal de cores */}
      <View className="flex-col gap-1">
        <Text className="text-white font-bold" style={{ fontSize: 16 }}>
          Exercício selecionado: {exerciseName}
        </Text>
        
        {/* Legenda colorida com marcadores */}
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

      {/* Bloco 6: Área principal do gráfico — sem scroll, ocupa 100% da largura do card */}
      <View className="flex-row w-full" style={{ height: chartHeight }}>
        
        {/* Eixo Y fixo à esquerda exibindo apenas os rótulos de texto de cada nível */}
        <View style={{ width: leftAxisWidth, height: chartHeight }}>
          <Svg width={leftAxisWidth} height={chartHeight}>
            {/* Maduro (Alinhado verticalmente em yMature) */}
            <SvgText
              x={10}
              y={yMature + 4}
              fill={colors.muted}
              fontSize={12}
              fontFamily="Inter-Medium"
            >
              Maduro
            </SvgText>

            {/* Intermediário (Alinhado verticalmente em yIntermediate) */}
            <SvgText
              x={10}
              y={yIntermediate + 4}
              fill={colors.muted}
              fontSize={12}
              fontFamily="Inter-Medium"
            >
              Intermediário
            </SvgText>

            {/* Inicial (Alinhado verticalmente em yInitial) */}
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

        {/* Eixo X fixo (sem scroll) contendo a grade e plotagem dos dados */}
        <View className="flex-1" style={{ height: chartHeight }}>
          <Svg width={plotWidth} height={chartHeight}>
            
            {/* Linhas horizontais de grade (Grid background) */}
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

              {/* Linhas verticais pontilhadas servindo de guia de sessão */}
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

              {/* Segmentos de linha de evolução com gradiente individual entre pontos */}
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
                        {/* Define um gradiente linear específico para o segmento da linha */}
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

              {/* Pontos de desempenho individuais e os números de sessão neutros (#66758A) */}
              {filteredRecords.map((rec, index) => {
                const x = getXPosition(index);
                const y = getLevelY(rec.developmentLevel);
                const dotColor = getLevelColor(rec.developmentLevel);

                return (
                  <React.Fragment key={`point-group-${rec.id}`}>
                    {/* Desenha a bolinha (ponto de evolução) com a cor correspondente */}
                    <Circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill={dotColor}
                      stroke={colors.level2}
                      strokeWidth={2}
                    />

                    {/* Exibe o número sequencial da sessão correspondente (cor neutra: #66758A) */}
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

      {/* Rótulo fixo geral "Sessão" posicionado no rodapé do card, centralizado sob a área rolável */}
      {filteredRecords.length > 0 && (
        <Text className="text-center text-xs font-bold text-muted mt-2">
          Sessão
        </Text>
      )}
    </View>
  );
}
