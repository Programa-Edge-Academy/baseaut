import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { RipplePressable } from "@/components/ripple-pressable";
import { Check, RotateCcw } from "lucide-react-native";
import React, { useState } from "react"; 
import { Text, View } from "react-native";
import { WarningBanner } from "./warning-banner"; 
import { ContinuationOptions } from "./continuation-options"; 
/**
 * Props for the session completion summary.
 */
interface SessionCompletionProps {
  title?: string; 
  details: string; 
  progress: string; 
  statusLabel?: string; 
  hasWarnings?: boolean;
  onContinue: () => void; 
  onSelectContinuation: (id: string) => void; 
  onBackToStart: () => void;
  className?: string;
}

/**
 * Renders a completion summary with optional warnings and actions.
 */
export function SessionCompletion({
  title = "Sessão Concluída!",
  details,
  progress,
  statusLabel = "Realizadas",
  hasWarnings = false,
  onContinue,
  onSelectContinuation, 
  onBackToStart,
  className = "",
}: SessionCompletionProps) {
  
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View className={`w-full max-w-md items-center p-6 ${className}`}>
      {/* Ícone de Sucesso Verde Circular */}
      <View
        className="h-20 w-20 items-center justify-center rounded-full mb-6"
        style={{ backgroundColor: colors.secondary + "15" }}
      >
        <Check size={40} color={colors.secondary} strokeWidth={3} />
      </View>

      {/* Textos Informativos Centralizados */}
      <Text className="text-[24px] font-bold text-white text-center mb-2">{title}</Text>
      <Text className="text-[16px] font-medium text-muted text-center mb-2">{details}</Text>
      <Text className="text-[24px] font-bold text-white text-center mb-2">{progress}</Text>
      <Text className="text-[16px] font-medium text-muted text-center mb-8">{statusLabel}</Text>

      {hasWarnings ? <WarningBanner className="mb-8" /> : null}

      {/* Linha de Botões de Ação */}
      <View className="w-full flex-row" style={{ gap: 12 }}>
        {/* Botão Continuar */}
        <RipplePressable
          onPress={() => setShowOptions(true)} // 
          className="flex-1 flex-row items-center justify-center rounded-[16px] bg-level1 border border-outline py-4 active:opacity-70"
          style={{ gap: 8 }}
        >
          <RotateCcw size={18} color={colors.muted} />
          <Text className="text-[16px] font-semibold text-muted">
            Continuar
          </Text>
        </RipplePressable>

        {/* Botão Voltar ao Início */}
        <DefaultButton
          label="Voltar ao início" 
          sizeClass="flex-1 py-4" 
          hasShadow={true} 
          textClassName="text-[16px] font-bold text-white" 
          onPress={onBackToStart} 
        />
      </View>

      {showOptions && (
        <View className="mt-6 w-full items-center">
          <ContinuationOptions 
            onCancel={() => setShowOptions(false)}
            onSelectOption={(id) => {
              setShowOptions(false); 
              onSelectContinuation(id); // Dispara a função pra tela principal fazer a navegação
            }}
          />
        </View>
      )}
    </View>
  );
}