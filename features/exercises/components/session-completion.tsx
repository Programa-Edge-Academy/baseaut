import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { RipplePressable } from "@/components/ripple-pressable";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { Check, RotateCcw } from "lucide-react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ContinuationOptions } from "./continuation-options";
import { WarningBanner } from "./warning-banner";
/**
 * Props for the session completion summary.
 */
interface SessionCompletionProps {
  title?: string;
  details: string;
  progress: string;
  statusLabel?: string;
  hasWarnings?: boolean;
  unrealizedCount?: number;
  onSelectContinuation: (id: string) => void;
  onBackToStart: () => void;
  className?: string;
}

/**
 * Renders a completion summary with optional warnings and actions.
 */
export function SessionCompletion({
  title,
  details,
  progress,
  statusLabel,
  hasWarnings = false,
  unrealizedCount =0,
  onSelectContinuation,
  onBackToStart,
  className = "",
}: SessionCompletionProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("sessionCompletion.title");
  const resolvedStatusLabel = statusLabel ?? t("sessionCompletion.completed");
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View className={`w-full max-w-md items-center p-6 ${className}`}>
      <View
        className="h-20 w-20 items-center justify-center rounded-full mb-6"
        style={{ backgroundColor: colors.secondary + "15" }}
      >
        <Check size={40} color={colors.secondary} strokeWidth={3} />
      </View>

      <Text className="text-[24px] font-bold text-content text-center mb-2">
        {resolvedTitle}
      </Text>
      <Text className="text-[16px] font-medium text-muted text-center mb-2">
        {details}
      </Text>
      <Text className="text-[24px] font-bold text-content text-center mb-2">
        {progress}
      </Text>
      <Text className="text-[16px] font-medium text-muted text-center mb-8">
        {resolvedStatusLabel}
      </Text>

      {hasWarnings ? <WarningBanner className="mb-8" /> : null}

      <View className="w-full flex-row" style={{ gap: 12 }}>
        <RipplePressable
          onPress={() => setShowOptions(true)}
          className="flex-1 flex-row items-center justify-center rounded-[16px] bg-level1 border border-outline py-4 active:opacity-70"
          style={{ gap: 8 }}
        >
          <RotateCcw size={16} color={colors.muted} />
          <Text className="text-header-3 text-muted">
            {t("common.continue")}
          </Text>
        </RipplePressable>

        <DefaultButton
          label={t("sessionCompletion.backToStart")}
          sizeClass="flex-1 py-4"
          hasShadow={true}
          onPress={onBackToStart}
        />
      </View>

      {showOptions && (
        <View className="mt-6 w-full items-center">
          <ContinuationOptions 
            unrealizedCount={unrealizedCount} 
            
            onCancel={() => setShowOptions(false)}
            onSelectOption={(id) => {
              setShowOptions(false); 
              onSelectContinuation(id); 
            }}
          />
        </View>
      )}
    </View>
  );
}
