import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../assets/colors";

/** Which pair of sibling routes a {@link SectionField} toggles between. */
export type SectionFieldMode = "exercises" | "circuits" | "analysis" | "reports";

/** Props for {@link SectionField}. */
interface SectionFieldProps {
  mode: SectionFieldMode;
  className?: string;
}

/**
 * Segmented control that switches between two sibling routes (exercises/circuits
 * or analysis/reports). Tapping the already active side is a no-op.
 */
export function SectionField({ mode, className }: SectionFieldProps) {
  const router = useRouter();

  const config = {
    exercises: {
      left: { label: "Exercícios", route: "/exercises" },
      right: { label: "Circuitos", route: "/circuits" },
      isRightActive: false,
    },
    circuits: {
      left: { label: "Exercícios", route: "/exercises" },
      right: { label: "Circuitos", route: "/circuits" },
      isRightActive: true,
    },
    analysis: {
      left: { label: "Análises", route: "/analysis" },
      right: { label: "Relatórios", route: "/reports" },
      isRightActive: false,
    },
    reports: {
      left: { label: "Análises", route: "/analysis" },
      right: { label: "Relatórios", route: "/reports" },
      isRightActive: true,
    },
  }[mode];

  const goToLeft = () => {
    if (config.isRightActive) router.replace(config.left.route as any);
  };
  const goToRight = () => {
    if (!config.isRightActive) router.replace(config.right.route as any);
  };

  return (
    <View
      className={`h-11 w-full flex-row rounded-2xl ${className ?? ""}`}
      style={{ backgroundColor: colors.outline, padding: 5 }}
    >
      <Pressable
        onPress={goToLeft}
        className="flex-1 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: !config.isRightActive ? colors.level2 : "transparent" }}
      >
        <Text
          className={`text-base font-bold ${!config.isRightActive ? "text-white" : "text-muted"}`}
        >
          {config.left.label}
        </Text>
      </Pressable>

      <Pressable
        onPress={goToRight}
        className="flex-1 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: config.isRightActive ? colors.level2 : "transparent" }}
      >
        <Text
          className={`text-base font-bold ${config.isRightActive ? "text-white" : "text-muted"}`}
        >
          {config.right.label}
        </Text>
      </Pressable>
    </View>
  );
}