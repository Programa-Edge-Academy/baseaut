import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
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
import React, { useEffect, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

export type StopwatchVariant = "minimize" | "form";

export type StopwatchProps = {
  title: string;
  subtitle: string;
  /** Exercise photo URI. When present, it is shown to the left of the title. */
  imageUrl?: string;
  /** Whether the stopwatch starts ticking on mount. Defaults to true. */
  autoStart?: boolean;
  /** Starting value in seconds. Defaults to 0. */
  initialSeconds?: number;
  /** If provided, overrides internal seconds state */
  controlledSeconds?: number;
  /** If provided, overrides internal running state */
  controlledIsRunning?: boolean;
  /** Fired when the user taps the timer container. Receives the new running state. */
  onToggleRunning?: (isRunning: boolean) => void;
  /**
   * Fired when the user taps the stop button. Receives the final elapsed
   * seconds before the internal counter is reset to zero.
   */
  onStop?: (elapsedSeconds: number) => void;
  /**
   * Fired when the user taps restart. In controlled mode the parent must reset
   * the time (internal state is ignored when `controlledSeconds` is used).
   */
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
  /** Tutorial spotlight key(s) for the "Crise" pill (one per required press). */
  criseSpotlightKey?: string | string[];
  /** Tutorial spotlight key(s) for the "Fuga" pill (one per required press). */
  fugaSpotlightKey?: string | string[];
  /** Tutorial spotlight key(s) for the timer (play/pause) pressable. */
  timerSpotlightKey?: string | string[];
  /** Tutorial spotlight key(s) for the corner action (minimize, or show/hide form). */
  cornerSpotlightKey?: string | string[];
  /** Tutorial spotlight key for the restart button. */
  restartSpotlightKey?: string | string[];
  /** Tutorial spotlight key for the stop button. */
  stopSpotlightKey?: string | string[];
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
 * In-activity stopwatch card. Renders the activity title/subtitle, crisis and
 * flight action pills, a self-ticking timer and a corner action that either
 * minimizes the card or opens a form.
 *
 * The timer icon and clock share a single translucent, bordered pressable that
 * toggles play/pause. Below it, full-width "Redefinir" (restart, left) and
 * "Parar" (stop, right) buttons fill the row. While a crisis or flight episode
 * is being timed, the corresponding pill label is replaced by a live elapsed
 * counter for that episode.
 *
 * @remarks
 * Each of the six controls can be registered as a tutorial spotlight target via
 * its own `*SpotlightKey` prop. The targets are the control pressables
 * themselves rather than a wrapper around the card, so the highlight ring hugs
 * the individual control. Advancing the sub-step stays with the parent, which
 * already owns every control's press handler.
 */
export function Stopwatch({
  title,
  subtitle,
  imageUrl,
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
  criseSpotlightKey,
  fugaSpotlightKey,
  timerSpotlightKey,
  cornerSpotlightKey,
  restartSpotlightKey,
  stopSpotlightKey,
}: StopwatchProps) {
  const colors = useThemeColors();
  const sim = useTutorialSimulation();
  const [internalIsRunning, setInternalIsRunning] = useState(autoStart);
  const [internalSeconds, setInternalSeconds] = useState(initialSeconds);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const criseStartedAtRef = useRef<number | null>(null);
  const fugaStartedAtRef = useRef<number | null>(null);

  const criseRef = useRef<View>(null);
  const fugaRef = useRef<View>(null);
  const timerRef = useRef<View>(null);
  const cornerRef = useRef<View>(null);
  const restartRef = useRef<View>(null);
  const stopRef = useRef<View>(null);

  useEffect(() => {
    const entries: [string | string[] | undefined, React.RefObject<View | null>][] = [
      [criseSpotlightKey, criseRef],
      [fugaSpotlightKey, fugaRef],
      [timerSpotlightKey, timerRef],
      [cornerSpotlightKey, cornerRef],
      [restartSpotlightKey, restartRef],
      [stopSpotlightKey, stopRef],
    ];
    const present = entries.filter(([key]) => !!key) as [
      string | string[],
      React.RefObject<View | null>,
    ][];
    if (present.length === 0) return;
    present.forEach(([key, ref]) => sim.registerTarget(key, ref, { rounded: true }));
    const allKeys = present.flatMap(([key]) => (Array.isArray(key) ? key : [key]));
    return () => sim.unregisterTarget(allKeys);
  }, [
    sim,
    criseSpotlightKey,
    fugaSpotlightKey,
    timerSpotlightKey,
    cornerSpotlightKey,
    restartSpotlightKey,
    stopSpotlightKey,
  ]);

  if (isCriseActive && criseStartedAtRef.current == null) {
    criseStartedAtRef.current = Date.now();
  } else if (!isCriseActive) {
    criseStartedAtRef.current = null;
  }
  if (isFugaActive && fugaStartedAtRef.current == null) {
    fugaStartedAtRef.current = Date.now();
  } else if (!isFugaActive) {
    fugaStartedAtRef.current = null;
  }

  useEffect(() => {
    if (!isCriseActive && !isFugaActive) return;
    const id = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(id);
  }, [isCriseActive, isFugaActive]);

  const criseLabel =
    isCriseActive && criseStartedAtRef.current != null
      ? formatTime((nowMs - criseStartedAtRef.current) / 1000)
      : "Crise";
  const fugaLabel =
    isFugaActive && fugaStartedAtRef.current != null
      ? formatTime((nowMs - fugaStartedAtRef.current) / 1000)
      : "Fuga";

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
  };

  const handleRestart = () => {
    if (controlledSeconds === undefined) {
      setInternalSeconds(0);
    }
    if (controlledIsRunning === undefined) {
      setInternalIsRunning(true);
    }
    onRestart?.();
    onToggleRunning?.(true);
  };

  return (
    <View
      className={`w-full rounded-2xl border border-outline bg-level2 p-4 ${className ?? ""}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3 flex-row items-center gap-3">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 44, height: 44, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : null}
          <View className="flex-1">
            <Text className="text-header-3 text-content" numberOfLines={1}>
              {title}
            </Text>
            <Text className="mt-1 text-default-2 text-muted" numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View className="items-end gap-1.5">
          <Pressable
            ref={criseRef}
            collapsable={false}
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
              className={`text-default-2 ${isCriseActive ? "text-content" : "text-extra"}`}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {criseLabel}
            </Text>
          </Pressable>

          <Pressable
            ref={fugaRef}
            collapsable={false}
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
              className={`text-default-2 ${isFugaActive ? "text-content" : "text-extra"}`}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {fugaLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-3 flex-row items-stretch gap-3">
        <Pressable
          ref={timerRef}
          collapsable={false}
          onPress={handleToggle}
          className="h-12 flex-1 flex-row items-center justify-center gap-3 rounded-2xl border border-outline bg-content/5 active:opacity-70"
        >
          <Timer size={22} color={colors.muted} />

          <Text
            className="text-content"
            style={{
              fontFamily: "Inter-Bold",
              fontSize: 26,
              lineHeight: 30,
              fontVariant: ["tabular-nums"],
              textAlign: "center",
            }}
          >
            {formatTime(seconds)}
          </Text>

          {isRunning ? (
            <Pause size={20} color={colors.muted} />
          ) : (
            <Play size={20} color={colors.muted} />
          )}
        </Pressable>

        <Pressable
          ref={cornerRef}
          collapsable={false}
          onPress={onPressCorner}
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-outline bg-level1 active:opacity-70"
        >
          {variant === "form" ? (
            <>
              {isFormVisible ? (
                <Minimize2 size={18} color={colors.muted} />
              ) : (
                <ClipboardEdit size={18} color={colors.muted} />
              )}
              <Text className="text-default-1 text-muted">
                {isFormVisible ? "Ocultar" : "Exibir"}
              </Text>
            </>
          ) : (
            <Minimize2 size={18} color={colors.muted} />
          )}
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-3">
        <Pressable
          ref={restartRef}
          collapsable={false}
          onPress={handleRestart}
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-outline bg-level1 active:opacity-70"
        >
          <RotateCcw size={18} color={colors.muted} />
          <Text className="text-default-1 text-muted">Redefinir</Text>
        </Pressable>

        <Pressable
          ref={stopRef}
          collapsable={false}
          onPress={handleStop}
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-error bg-error/10 active:opacity-70"
        >
          <View className="h-4 w-4 rounded-[3px] bg-error" />
          <Text className="text-default-1 text-error">Parar</Text>
        </Pressable>
      </View>
    </View>
  );
}
