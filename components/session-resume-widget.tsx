import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Play, Pause, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { colors } from "@/assets/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SessionResumeWidgetProps = {
  mode: "single" | "multiple";
  studentName: string;
  exerciseProgress: string; // e.g. "Exercício 1/3"
  timeElapsed: string; // e.g. "00:12"
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPress: () => void; // To maximize/return to session
  onClose: () => void; // To dismiss/close the widget
  onPrev?: () => void;
  onNext?: () => void;
};

export function SessionResumeWidget({
  mode,
  studentName,
  exerciseProgress,
  timeElapsed,
  isPlaying,
  onTogglePlay,
  onPress,
  onClose,
  onPrev,
  onNext,
}: SessionResumeWidgetProps) {
  const insets = useSafeAreaInsets();
  // Tab bar height is approximately 60px + safe area bottom
  const TAB_BAR_HEIGHT = 60;
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom + 8;

  return (
    <View
      style={[styles.container, { bottom: bottomOffset }]}
      className="absolute self-center w-[92%] max-w-[400px] h-[74px] bg-level2 border border-primary rounded-[15px] flex-row items-center px-3"
      pointerEvents="box-none"
    >
      {/* Play/Pause Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="w-[46px] h-[46px] bg-primary/20 rounded-[15px] items-center justify-center mr-3 flex-shrink-0"
      >
        {isPlaying ? (
          <Pause fill={colors.primary} color={colors.primary} size={20} />
        ) : (
          <Play fill={colors.primary} color={colors.primary} size={20} />
        )}
      </Pressable>

      {/* Multiple Mode: Prev Arrow */}
      {mode === "multiple" && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onPrev?.();
          }}
          className="p-1 mr-1 active:opacity-70 flex-shrink-0"
        >
          <ChevronLeft color={colors.muted} size={22} />
        </Pressable>
      )}

      {/* Center Content (Clickable to maximize) */}
      <Pressable
        onPress={onPress}
        className="flex-1 justify-center active:opacity-70 py-1"
      >
        <Text className="text-white text-[16px] font-medium leading-[20px] mb-0.5" numberOfLines={1}>
          {studentName}
        </Text>
        <Text className="text-muted text-[14px] font-medium leading-[20px]" numberOfLines={1}>
          {exerciseProgress} · {timeElapsed}
        </Text>
      </Pressable>

      {/* Multiple Mode: Next Arrow */}
      {mode === "multiple" && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          className="p-1 ml-1 active:opacity-70 flex-shrink-0"
        >
          <ChevronRight color={colors.muted} size={22} />
        </Pressable>
      )}

      {/* Close Button (always shown) */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-2 p-1 active:opacity-70 flex-shrink-0"
      >
        <X color={colors.muted} size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
      web: {
        // @ts-ignore
        boxShadow: "0px 0px 10px rgba(0,0,0,0.25)",
      },
    }),
  },
});
