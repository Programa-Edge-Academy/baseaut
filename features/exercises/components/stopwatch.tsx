import { colors } from "@/assets/colors";
import {
  ClipboardEdit,
  Minimize2,
  Pause,
  Play,
  Siren,
  Timer,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export type StopwatchVariant = "minimize" | "form";

export type StopwatchProps = {
  title: string;
  subtitle: string;
  /** Whether the stopwatch starts ticking on mount. Defaults to true. */
  autoStart?: boolean;
  /** Starting value in seconds. Defaults to 0. */
  initialSeconds?: number;
  /** Fired when the user taps the play/pause icon. Receives the new running state. */
  onToggleRunning?: (isRunning: boolean) => void;
  /**
   * Fired when the user taps the stop button. Receives the final elapsed
   * seconds before the internal counter is reset to zero.
   */
  onStop?: (elapsedSeconds: number) => void;
  /** Fired when the user taps the "Crise" pill. */
  onPressCrise?: () => void;
  /** Visual variant for the bottom-right corner action. Defaults to "minimize". */
  variant?: StopwatchVariant;
  /** Fired when the user taps the bottom-right corner action. */
  onPressCorner?: () => void;
  className?: string;
};

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
}

/**
 * In-activity stopwatch card. Renders the activity title/subtitle, a crisis
 * action pill, a self-ticking timer with play/pause and stop controls, and a
 * corner action that either minimizes the card or opens a form.
 */
export function Stopwatch({
  title,
  subtitle,
  autoStart = true,
  initialSeconds = 0,
  onToggleRunning,
  onStop,
  onPressCrise,
  variant = "minimize",
  onPressCorner,
  className,
}: StopwatchProps) {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const handleToggle = () => {
    const next = !isRunning;
    setIsRunning(next);
    onToggleRunning?.(next);
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop?.(seconds);
    //setSeconds(0); Estava zerando o cronômetro, então se esbarrar o dedo e sair do modal, vocÊ perde o tempo registrado.
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

        <Pressable
          onPress={onPressCrise}
          hitSlop={6}
          className="flex-row items-center gap-1.5 rounded-full border border-extra bg-extra/10 px-3 py-1 active:opacity-70"
        >
          <Siren size={14} color={colors.extra} />
          <Text className="text-default-2 text-extra">Crise</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Timer size={24} color={colors.muted} />

          <Text
            className="text-white"
            style={{
              fontFamily: "Inter-Bold",
              fontSize: 30,
              lineHeight: 32,
              fontVariant: ["tabular-nums"],
              minWidth: 90,
              textAlign: "center",
            }}
          >
            {formatTime(seconds)}
          </Text>

          <Pressable
            onPress={handleToggle}
            hitSlop={8}
            className="active:opacity-70"
          >
            {isRunning ? (
              <Pause size={22} color={colors.muted} />
            ) : (
              <Play size={22} color={colors.muted} />
            )}
          </Pressable>

          <Pressable
            onPress={handleStop}
            hitSlop={8}
            className="active:opacity-70"
          >
            <View className="h-5 w-5 rounded-[3px] bg-error" />
          </Pressable>
        </View>

        <Pressable
          onPress={onPressCorner}
          hitSlop={8}
          className="active:opacity-70"
        >
          {variant === "form" ? (
            <ClipboardEdit size={20} color={colors.muted} />
          ) : (
            <Minimize2 size={20} color={colors.muted} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
