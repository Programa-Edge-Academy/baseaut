import { colors } from '@/assets/colors';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export type ProgressExerciseCardProps = {
  title: string;
  statusLabel?: string;
  statusTone?: 'green' | 'yellow' | 'red' | 'gray';
  sessions?: number;
  evolution?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

const statusColors = {
  green: colors.secondary,
  yellow: colors.extra,
  red: colors.error,
  gray: colors.muted,
};

function formatSessions(count?: number) {
  if (count === undefined || count === null) {
    return 'Ainda não registrado';
  }

  return `${count} sessão${count === 1 ? '' : 's'} realizada${count === 1 ? '' : 's'}`;
}

function formatEvolution(evolution?: string) {
  if (!evolution) {
    return 'Aguardando novos registros';
  }

  return evolution;
}

export default function ProgressExerciseCard({
  title,
  statusLabel = 'Sem registro',
  statusTone = 'gray',
  sessions,
  evolution,
  onPress,
  disabled = false,
  testID,
}: ProgressExerciseCardProps) {
  const statusColor = statusColors[statusTone] ?? colors.muted;
  const evolutionText = formatEvolution(evolution);
  const evolutionColor = evolution ? statusColor : colors.muted;

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className="rounded-3xl border border-outline bg-level2 p-4"
      testID={testID}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-white">{title}</Text>
        <View className="rounded-full border border-outline px-3 py-1">
          <Text className="text-xs font-medium" style={{ color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="mt-3 space-y-2">
        <Text className="text-sm text-muted">
          Último desempenho: <Text style={{ color: statusColor, fontWeight: '600' }}>{statusLabel}</Text>
        </Text>
        <Text className="text-sm text-muted">{formatSessions(sessions)}</Text>
        <Text className="text-sm text-muted">
          Evolução: <Text style={{ color: evolutionColor, fontWeight: '600' }}>{evolutionText}</Text>
        </Text>
      </View>
    </Pressable>
  );
}
