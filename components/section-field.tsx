import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "../assets/colors";

export type SectionFieldMode = "exercises" | "circuits" | "analysis" | "reports";

interface SectionFieldProps {
  mode: SectionFieldMode;
  className?: string;
}

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

  const handleToggle = () => {
    const nextRoute = config.isRightActive ? config.left.route : config.right.route;
    router.replace(nextRoute as any);
  };

  return (
    <Pressable
      onPress={handleToggle}
      className={`h-11 w-full flex-row rounded-2xl ${className ?? ""}`}
      style={{ backgroundColor: colors.outline, padding: 5 }}
    >
      <View
        className="flex-1 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: !config.isRightActive ? colors.level2 : "transparent" }}
      >
        <Text
          className={`text-base font-bold ${!config.isRightActive ? "text-white" : "text-muted"}`}
        >
          {config.left.label}
        </Text>
      </View>

      <View
        className="flex-1 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: config.isRightActive ? colors.level2 : "transparent" }}
      >
        <Text
          className={`text-base font-bold ${config.isRightActive ? "text-white" : "text-muted"}`}
        >
          {config.right.label}
        </Text>
      </View>
    </Pressable>
  );
}