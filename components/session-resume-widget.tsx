import { colors } from "@/assets/colors";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Props for {@link SessionResumeWidget}. */
export type SessionResumeWidgetProps = {
  /** "multiple" renders prev/next navigation arrows for multi-student sessions. */
  mode: "single" | "multiple";
  studentName: string;
  /** Current exercise progress label, e.g. "Exercício 1/3". */
  exerciseProgress: string;
  /** Elapsed time label, e.g. "00:12". */
  timeElapsed: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** Called to maximize and return to the session. */
  onPress: () => void;
  /** Called to dismiss the widget. */
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

/**
 * Floating mini-player anchored above the tab bar that shows the active session,
 * exposes play/pause, optional prev/next navigation, and tap-to-maximize.
 */
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
  const TAB_BAR_HEIGHT = 84;
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom + 16;

  return (
    <View
      style={[styles.container, { bottom: bottomOffset }]}
      className="absolute self-center w-[92%] max-w-[400px] h-[74px] bg-level2 border border-primary rounded-[15px] flex-row items-center px-3"
      pointerEvents="box-none"
    >
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

      <Pressable
        onPress={onPress}
        className="flex-1 justify-center active:opacity-70 py-1"
      >
        <Text className="text-content text-[16px] font-medium leading-[20px] mb-0.5" numberOfLines={1}>
          {studentName}
        </Text>
        <Text className="text-muted text-[14px] font-medium leading-[20px]" numberOfLines={1}>
          {exerciseProgress} · {timeElapsed}
        </Text>
      </Pressable>

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
