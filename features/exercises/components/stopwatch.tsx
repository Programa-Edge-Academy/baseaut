import { colors } from "@/assets/colors";
import {
  ClipboardEdit,
  Footprints,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
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
  /** If provided, overrides internal seconds state */
  controlledSeconds?: number;
  /** If provided, overrides internal running state */
  controlledIsRunning?: boolean;
  /** Fired when the user taps the play/pause icon. Receives the new running state. */
  onToggleRunning?: (isRunning: boolean) => void;
  /**
   * Fired when the user taps the stop button. Receives the final elapsed
   * seconds before the internal counter is reset to zero.
   */
  onStop?: (elapsedSeconds: number) => void;
  /** Fired when the user taps restart. Em modo controlado, o pai deve zerar o
   * tempo (o estado interno é ignorado quando `controlledSeconds` é usado). */
  onRestart?: () => void;
  /** Fired when the user taps the "Crise" pill. */
  onPressCrise?: () => void;
  /** Whether a crisis is currently being timed (turns the pill solid red). */
  isCriseActive?: boolean;
  /** Fired when the user taps the "Fuga" pill. */
  onPressFuga?: () => void;
  /** Whether a flight episode is currently being timed (turns the pill solid red). */
  isFugaActive?: boolean;
  /** Visual variant for the bottom-right corner action. Defaults to "minimize". */
  variant?: StopwatchVariant;
  /** Fired when the user taps the bottom-right corner action. */
  onPressCorner?: () => void;
  className?: string;
  isFormVisible?: boolean;
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
  controlledSeconds,
  controlledIsRunning,
  onToggleRunning,
  onStop,
  onRestart,
  onPressCrise,
  isCriseActive = false,
  onPressFuga,
  isFugaActive = false,
  variant = "minimize",
  onPressCorner,
  className,
  isFormVisible = true,
}: StopwatchProps) {
  const [internalIsRunning, setInternalIsRunning] = useState(autoStart);
  const [internalSeconds, setInternalSeconds] = useState(initialSeconds);

  const isRunning = controlledIsRunning !== undefined ? controlledIsRunning : internalIsRunning;
  const seconds = controlledSeconds !== undefined ? controlledSeconds : internalSeconds;

  useEffect(() => {
    if (controlledSeconds !== undefined) return;
    if (!isRunning) return;
    const id = setInterval(() => {
      setInternalSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, controlledSeconds]);

  const handleToggle = () => {
    const next = !isRunning;
    if (controlledIsRunning === undefined) {
      setInternalIsRunning(next);
    }
    onToggleRunning?.(next);
  };

  const handleStop = () => {
    if (controlledIsRunning === undefined) {
      setInternalIsRunning(false);
    }
    onStop?.(seconds);
    //setSeconds(0); Estava zerando o cronômetro, então se esbarrar o dedo e sair do modal, vocÊ perde o tempo registrado.
  };

  // Zera o contador e mantém a contagem em andamento.
  const handleRestart = () => {
    // Modo não-controlado: zera o estado interno.
    if (controlledSeconds === undefined) {
      setInternalSeconds(0);
    }
    if (controlledIsRunning === undefined) {
      setInternalIsRunning(true);
    }
    // Modo controlado: o pai zera o tempo (updateTimeElapsed) e garante rodando.
    onRestart?.();
    onToggleRunning?.(true);
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

        <View className="items-end gap-1.5">
          <Pressable
            onPress={onPressCrise}
            hitSlop={6}
            className={`w-[88px] flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-1 active:opacity-70 ${
              isCriseActive
                ? "border-error bg-error"
                : "border-extra bg-extra/10"
            }`}
          >
            <Siren size={14} color={isCriseActive ? "#fff" : colors.extra} />
            <Text
              className={`text-default-2 ${isCriseActive ? "text-white" : "text-extra"}`}
            >
              Crise
            </Text>
          </Pressable>

          <Pressable
            onPress={onPressFuga}
            hitSlop={6}
            className={`w-[88px] flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-1 active:opacity-70 ${
              isFugaActive
                ? "border-error bg-error"
                : "border-extra bg-extra/10"
            }`}
          >
            <Footprints size={14} color={isFugaActive ? "#fff" : colors.extra} />
            <Text
              className={`text-default-2 ${isFugaActive ? "text-white" : "text-extra"}`}
            >
              Fuga
            </Text>
          </Pressable>
        </View>
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

          <Pressable
            onPress={handleRestart}
            hitSlop={8}
            className="active:opacity-70"
          >
            <RotateCcw size={20} color={colors.muted} />
          </Pressable>
        </View>

        <Pressable
          onPress={onPressCorner}
          hitSlop={8}
          className="active:opacity-70"
        >
        {variant === "form" ? (
            isFormVisible ? (
              <Minimize2 size={20} color={colors.muted} />
            ) : (
              <ClipboardEdit size={20} color={colors.muted} />
            )
          ) : (
            <Minimize2 size={20} color={colors.muted} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
