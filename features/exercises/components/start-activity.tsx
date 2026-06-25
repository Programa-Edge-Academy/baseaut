import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ReplaceAll,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

export type StartActivityProps = {
  title: string;
  subtitle: string;
  onStart: () => void;
  onStartAndRecord?: (() => void) | null;
  onPressInfo?: () => void;
  /**
   * Ordered list of media URLs (images) shown inside the preview carousel.
   * When empty, the preview area is omitted even if the toggle is on.
   */
  iconUrl?: string | null;
  /**
   * Initial state of the preview toggle. Defaults to `false` (collapsed).
   */
  defaultPreviewVisible?: boolean;
  className?: string;
};

/**
 * Card used to launch an activity. The eye toggle reveals/hides a media
 * carousel between the header and the action buttons.
 */
export function StartActivity({
  title,
  subtitle,
  onStart,
  onStartAndRecord,
  onPressInfo,
  iconUrl,
  defaultPreviewVisible = false,
  className,
}: StartActivityProps) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(defaultPreviewVisible);
  const hasMedia = !!iconUrl;

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
          {onPressInfo && (
            <Pressable
              onPress={onPressInfo}
              hitSlop={8}
              className="active:opacity-70"
            >
              <ReplaceAll size={20} color={colors.muted} />
            </Pressable>
          )}
          {hasMedia && (
            <Pressable
              onPress={() => setIsPreviewVisible((current) => !current)}
              hitSlop={8}
              className="active:opacity-70"
            >
              <ImageIcon 
                size={20} 
                color={isPreviewVisible ? colors.primary : colors.muted} 
              />
            </Pressable>
          )}
        </View>
      </View>

      {isPreviewVisible && hasMedia && (
        <View
          className="mt-4 w-full overflow-hidden rounded-2xl bg-level1"
          style={{ aspectRatio: 4 / 3 }}
        >
          <Image
            source={{ uri: iconUrl as string }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>
      )}

      <View className="mt-4 flex-row gap-2.5">
        <DefaultButton
          label="Iniciar atividade"
          onPress={onStart}
          bgColorClass="bg-primary"
          shadowClass="shadow-primaryShadow"
          sizeClass="flex-1 h-11"
          textClassName="text-white"
        />
      </View>
    </View>
  );
}
