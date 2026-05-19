import { colors } from "@/assets/colors";
import { ChevronLeft, ChevronRight, Clock, Play, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface MonitoringFieldProps {
  studentName: string;
  exerciseNumber: number;
  totalExercises: number;
  timeElapsed: string; // format "00:12"
  hideArrows?: boolean;
  onPressLeft?: () => void;
  onPressRight?: () => void;
  onPressPlay?: () => void;
  onPressClose?: () => void;
}

export function MonitoringField({
  studentName,
  exerciseNumber,
  totalExercises,
  timeElapsed,
  hideArrows = false,
  onPressLeft,
  onPressRight,
  onPressPlay,
  onPressClose,
}: MonitoringFieldProps) {
  return (
    <View
      className="rounded-2xl border border-primary bg-level2"
      style={styles.container}
    >
      <View className="flex-row items-center justify-between px-4 py-4">
        {/* Left arrow */}
        {!hideArrows && (
          <Pressable
            onPress={onPressLeft}
            className="active:opacity-70"
            disabled={!onPressLeft}
          >
            <ChevronLeft size={24} color={colors.muted} strokeWidth={2.5} />
          </Pressable>
        )}

        {/* Play icon background */}
        <Pressable
          onPress={onPressPlay}
          className="items-center justify-center rounded-xl active:opacity-70"
          style={styles.playButton}
          disabled={!onPressPlay}
        >
          <Play size={20} color={colors.primary} strokeWidth={2} />
        </Pressable>

        {/* Center content - Student name, exercise, and time */}
        <View className="flex-1 px-3">
          {/* Student name */}
          <Text
            className="text-base font-medium leading-5"
            style={{ color: 'white' }}
            numberOfLines={1}
          >
            {studentName}
          </Text>

          {/* Exercício e Tempo */}
          <View className="flex-row items-center gap-0.5 pt-1">
            <Text
              className="text-xs font-medium leading-5"
              style={{ color: colors.muted }}
              numberOfLines={1}
            >
              Exercício {exerciseNumber}/{totalExercises} ·
            </Text>

            {/* Clock icon */}
            <Clock size={10} color={colors.muted} strokeWidth={2.5} />

            {/* Time */}
            <Text
              className="text-xs font-medium leading-5"
              style={{ color: colors.muted }}
              numberOfLines={1}
            >
              {timeElapsed}
            </Text>
          </View>
        </View>

        {/* Right arrow */}
        {!hideArrows && (
          <Pressable
            onPress={onPressRight}
            className="active:opacity-70"
            disabled={!onPressRight}
          >
            <ChevronRight size={24} color={colors.muted} strokeWidth={2.5} />
          </Pressable>
        )}

        {/* Close icon (X) */}
        <Pressable
          onPress={onPressClose}
          className="ml-2 active:opacity-70"
          disabled={!onPressClose}
        >
          <X size={24} color={colors.muted} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 80,
  },
  playButton: {
    backgroundColor: '#1A2836',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 8,
  },
});
