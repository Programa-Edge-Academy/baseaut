import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Play, Pause, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react-native";
import { colors } from "@/assets/colors";

export type SessionResumeWidgetProps = {
  mode: "single" | "multiple";
  studentName: string;
  exerciseProgress: string; // e.g. "Exercício 1/3"
  timeElapsed: string; // e.g. "00:12"
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPress: () => void; // To maximize/return to session
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
  onPrev,
  onNext,
}: SessionResumeWidgetProps) {
  return (
    <View
      style={styles.container}
      className="absolute bottom-6 self-center w-[90%] max-w-[400px] h-[74px] bg-level2 border border-primary rounded-[15px] flex-row items-center px-4"
    >
      {/* Play/Pause Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="w-[46px] h-[46px] bg-primary/20 rounded-[15px] items-center justify-center mr-3"
      >
        {isPlaying ? (
          <Pause fill={colors.primary} color={colors.primary} size={22} />
        ) : (
          <Play fill={colors.primary} color={colors.primary} size={22} className="ml-1" />
        )}
      </Pressable>

      {/* Multiple Mode: Prev Arrow */}
      {mode === "multiple" && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onPrev?.();
          }}
          className="p-2 mr-1 active:opacity-70"
        >
          <ChevronLeft color={colors.muted} size={24} />
        </Pressable>
      )}

      {/* Center Content (Clickable to maximize) */}
      <Pressable
        onPress={onPress}
        className="flex-1 justify-center active:opacity-70"
      >
        <Text className="text-white text-[16px] font-medium leading-[20px] mb-1" numberOfLines={1}>
          {studentName}
        </Text>
        <Text className="text-muted text-[14px] font-medium leading-[20px]" numberOfLines={1}>
          {exerciseProgress} · {timeElapsed}
        </Text>
      </Pressable>

      {/* Right Side Action */}
      {mode === "multiple" ? (
        /* Multiple Mode: Next Arrow */
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          className="p-2 ml-1 active:opacity-70"
        >
          <ChevronRight color={colors.muted} size={24} />
        </Pressable>
      ) : (
        /* Single Mode: Expand Icon */
        <Pressable
          onPress={onPress}
          className="p-2 ml-1 active:opacity-70"
        >
          <Maximize2 color={colors.muted} size={24} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0px 0px 5px rgba(0,0,0,0.25)",
      },
    }),
  },
});
