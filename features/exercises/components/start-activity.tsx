import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { Eye, Info } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type StartActivityProps = {
  title: string;
  subtitle: string;
  onStart: () => void;
  onStartAndRecord: () => void;
  onPressInfo?: () => void;
  onPressPreview?: () => void;
  className?: string;
};

/**
 * Card used to launch an activity. Shows the title/subtitle of the activity,
 * two utility actions (info / preview) and the two primary actions:
 * "Iniciar atividade" (start) and "Iniciar e gravar" (start and record).
 */
export function StartActivity({
  title,
  subtitle,
  onStart,
  onStartAndRecord,
  onPressInfo,
  onPressPreview,
  className,
}: StartActivityProps) {
  return (
    <View
      className={`w-full rounded-2xl border border-outline bg-level2 p-4 ${className ?? ""}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-header-3 text-white" numberOfLines={1}>
            {title}
          </Text>
          <Text className="mt-1 text-default-2 text-muted" numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={onPressInfo}
            hitSlop={8}
            className="active:opacity-70"
          >
            <Info size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={onPressPreview}
            hitSlop={8}
            className="active:opacity-70"
          >
            <Eye size={20} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2.5">
        <DefaultButton
          label="Iniciar atividade"
          onPress={onStart}
          bgColorClass="bg-primary"
          shadowClass="shadow-primaryShadow"
          sizeClass="flex-1 h-11"
          textClassName="text-white"
        />
        <DefaultButton
          label="Iniciar e gravar"
          onPress={onStartAndRecord}
          bgColorClass="bg-secondary"
          shadowClass="shadow-secondaryShadow"
          sizeClass="flex-1 h-11"
          textClassName="text-white"
        />
      </View>
    </View>
  );
}
