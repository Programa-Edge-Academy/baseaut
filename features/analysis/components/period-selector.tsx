import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { Calendar } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

/** Props for {@link PeriodSelector}. */
export type PeriodSelectorProps = {
  label?: string;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  /** Tutorial spotlight key for the selector row. */
  spotlightKey?: string;
};

/**
 * Calendar-icon row that opens a date-range picker; static when no handler is
 * given.
 *
 * @remarks
 * The spotlight target is the row itself rather than a wrapping
 * `SpotlightTarget`: the row carries its own margins, which a wrapper would
 * measure as part of the row and draw the ring off-center.
 */
export function PeriodSelector({
  label,
  onPress,
  containerStyle,
  spotlightKey,
}: PeriodSelectorProps) {
  const { t } = useI18n();
  const sim = useTutorialSimulation();
  const ref = useRef<View>(null);
  const displayLabel = label ?? t("analysis.selectPeriodProgress");
  const Container: any = onPress ? Pressable : View;

  useEffect(() => {
    if (!spotlightKey) return;
    sim.registerTarget(spotlightKey, ref, { rounded: true });
    return () => sim.unregisterTarget(spotlightKey);
  }, [sim, spotlightKey]);

  return (
    <Container
      ref={ref}
      collapsable={false}
      onPress={onPress}
      className="w-auto flex-row items-center border border-outline bg-level2 py-3 px-4 pr-6"
      style={[{ marginVertical: 8, marginHorizontal: 22, borderRadius: 15 }, containerStyle]}
    >
      <View className="mr-3">
        <Calendar size={20} color={colors.muted} strokeWidth={2} />
      </View>

      <Text className="text-xs text-content font-medium">{displayLabel}</Text>
    </Container>
  );
}

export default PeriodSelector;
