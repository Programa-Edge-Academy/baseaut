import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { RipplePressable } from "@/components/ripple-pressable";
import { Check, RotateCcw } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { WarningBanner } from "./warning-banner"; // Certifique-se de que o caminho está correto

/**
 * Props for the session completion summary.
 */
interface SessionCompletionProps {
  details: string; // Ex: "Lucas · Circuito 1 · Estruturado"
  statusLabel?: string; // Ex: "Realizadas"
  hasWarnings?: boolean;
  onContinue: () => void;
  onBackToStart: () => void;
  className?: string;
}

/**
 * Renders a completion summary with optional warnings and actions.
 */
export function SessionCompletion({
  details,
  statusLabel = "Realizadas",
  hasWarnings = false,
  onContinue,
  onBackToStart,
  className = "",
}: SessionCompletionProps) {
  return (
    <View className={`w-full max-w-md items-center p-6 ${className}`}>
      {/* Ícone de Sucesso Verde Circular */}
      <View
        className="h-20 w-20 items-center justify-center rounded-full mb-6"
        style={{ backgroundColor: colors.level1 }}
      >
        <Check size={40} color={colors.secondary} strokeWidth={3} />
      </View>

      {/* Textos Informativos Centralizados */}
      <Text className="text-[16px] font-medium text-muted text-center mb-2">
        {details}
      </Text>

      <Text className="text-[16px] font-medium text-muted text-center mb-8">
        {statusLabel}
      </Text>

      {/* 👈 Bloco condicional: Se 'hasWarnings' for true, renderiza o Banner com uma margem inferior */}
      {hasWarnings ? <WarningBanner className="mb-8" /> : null}

      {/* Linha de Botões de Ação */}
      <View className="w-full flex-row" style={{ gap: 12 }}>
        {/* Botão Continuar (Escuro com Ícone) */}
        <RipplePressable
          onPress={onContinue}
          className="flex-1 flex-row items-center justify-center rounded-[16px] bg-level1 border border-outline py-4 active:opacity-70"
          style={{ gap: 8 }}
        >
          <RotateCcw size={18} color={colors.muted} />
          <Text className="text-[16px] font-semibold text-muted">
            Continuar
          </Text>
        </RipplePressable>

        {/* Botão Voltar ao Início (Azul Destacado) */}
        <DefaultButton
          label="Voltar ao início" // Cor azul idêntica à imagem
          sizeClass="flex-1 py-4" // Substitui o tamanho padrão fixo por flex-1 para ocupar metade da linha
          hasShadow={true} // Desativa a sombra padrão se não houver no layout
          textClassName="text-[16px] font-bold text-white" // Sobrescreve o estilo do texto interno
          onPress={onBackToStart} // Sua função de callback para o clique
        />
      </View>
    </View>
  );
}
