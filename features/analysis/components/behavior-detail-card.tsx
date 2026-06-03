import React from "react";
import { Text, View } from "react-native";

export type BehaviorDetailCardProps = {
  behaviorName: string;
  color: string;
  occurrences: number;
  sessions: string[];
  exercises: string[];
  lastOccurrence: string;
};

type DetailRowProps = {
  label: string;
  value: string | number;
  color: string;
};

function DetailRow({ label, value, color }: DetailRowProps) {
  return (
    <View className="rounded-lg border border-outline bg-level1 p-3">
      <Text className="text-sm font-semibold text-muted">
        {label}:{" "}
        <Text style={{ color }} className="font-bold">
          {value}
        </Text>
      </Text>
    </View>
  );
}

export function BehaviorDetailCard({
  behaviorName,
  color,
  occurrences,
  sessions,
  exercises,
  lastOccurrence,
}: BehaviorDetailCardProps) {
  return (
    <View
      className="w-full max-w-[430px] self-center rounded-lg border bg-level2 p-4"
      style={{ borderColor: color }}
    >
      <View className="gap-3">
        <DetailRow
          label="Comportamento"
          value={behaviorName}
          color={color}
        />

        <DetailRow
          label="Ocorrências"
          value={occurrences}
          color={color}
        />

        <DetailRow
          label="Sessões"
          value={sessions.join(", ")}
          color={color}
        />

        <DetailRow
          label="Exercícios associados"
          value={exercises.join(", ")}
          color={color}
        />

        <DetailRow
          label="Última ocorrência"
          value={lastOccurrence}
          color={color}
        />
      </View>
    </View>
  );
}