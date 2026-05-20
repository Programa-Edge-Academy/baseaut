import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

export type StartActivityProps = {
  title: string;
  subtitle: string;
  onStart: () => void;
  onStartAndRecord: () => void;
  onPressInfo?: () => void;
  /**
   * Ordered list of media URLs (images) shown inside the preview carousel.
   * When empty, the preview area is omitted even if the toggle is on.
   */
  mediaUrls?: string[];
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
  mediaUrls = [],
  defaultPreviewVisible = false,
  className,
}: StartActivityProps) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(defaultPreviewVisible);
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMedia = mediaUrls.length > 0;
  const safeIndex = Math.min(currentIndex, Math.max(mediaUrls.length - 1, 0));
  const canShowPrev = safeIndex > 0;
  const canShowNext = safeIndex < mediaUrls.length - 1;

  const handlePrev = () => {
    if (canShowPrev) setCurrentIndex((i) => i - 1);
  };
  const handleNext = () => {
    if (canShowNext) setCurrentIndex((i) => i + 1);
  };

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
            onPress={() => setIsPreviewVisible((current) => !current)}
            hitSlop={8}
            className="active:opacity-70"
          >
            {isPreviewVisible ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </Pressable>
        </View>
      </View>

      {isPreviewVisible && hasMedia && (
        <View
          className="mt-4 w-full overflow-hidden rounded-2xl bg-level1"
          style={{ aspectRatio: 4 / 3 }}
        >
          <Image
            source={{ uri: mediaUrls[safeIndex] }}
            className="h-full w-full"
            resizeMode="cover"
          />

          <View className="absolute bottom-0 left-0 right-0 top-0 flex-row items-center justify-between px-2">
            {canShowPrev ? (
              <Pressable
                onPress={handlePrev}
                className="h-9 w-9 items-center justify-center rounded-full bg-black/40 active:opacity-70"
              >
                <ChevronLeft size={22} color="#fff" />
              </Pressable>
            ) : (
              <View className="w-9" />
            )}
            {canShowNext ? (
              <Pressable
                onPress={handleNext}
                className="h-9 w-9 items-center justify-center rounded-full bg-black/40 active:opacity-70"
              >
                <ChevronRight size={22} color="#fff" />
              </Pressable>
            ) : (
              <View className="w-9" />
            )}
          </View>

          {mediaUrls.length > 1 && (
            <View className="absolute bottom-2 left-2 right-2 h-1 flex-row gap-1">
              {mediaUrls.map((_, idx) => (
                <View
                  key={idx}
                  className={`flex-1 rounded-full ${
                    idx === safeIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </View>
          )}
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
