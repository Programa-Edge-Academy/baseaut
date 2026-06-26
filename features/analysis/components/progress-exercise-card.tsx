import { colors } from '@/assets/colors';
import { CircleArrowRightIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

/** Props for {@link ProgressExerciseCard}. */
export type ProgressExerciseCardProps = {
  title: string;
  statusLabel?: string;
  statusTone?: 'green' | 'yellow' | 'red' | 'gray';
  sessions?: number;
  evolutionLabel?: string;
  evolutionTone?: 'green' | 'yellow' | 'red' | 'gray';
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const toneColors = {
  green: colors.secondary,
  yellow: colors.extra,
  red: colors.error,
  gray: colors.muted,
};

/**
 * Tappable card summarizing a student's progress on one exercise: last
 * performance, session count, and evolution trend.
 */
export default function ProgressExerciseCard({
  title,
  statusLabel = 'Sem registro',
  statusTone = 'gray',
  sessions = 0,
  evolutionLabel = 'Aguardando novos registros',
  evolutionTone = 'gray',
  onPress,
  disabled = false,
  testID,
  style,
}: ProgressExerciseCardProps) {
  const statusColor = toneColors[statusTone] ?? colors.muted;
  const evolutionColor = toneColors[evolutionTone] ?? colors.muted;

  const formattedSessions = sessions === 0 
    ? 'Ainda não registrado' 
    : `${sessions} sessão${sessions === 1 ? '' : 's'} realizada${sessions === 1 ? '' : 's'}`;

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className="rounded-3xl border border-outline bg-level2 p-4"
      testID={testID}
      style={[{ opacity: disabled ? 0.6 : 1 }, style]} 
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4 gap-y-2">
          <Text className="text-base font-bold text-white mb-1">{title}</Text>
          
          <Text className="text-sm text-muted">
            Último desempenho: <Text style={{ color: statusColor, fontWeight: '600' }}>{statusLabel}</Text>
          </Text>
          
          <Text className="text-sm text-muted">{formattedSessions}</Text>
          
          <Text className="text-sm text-muted">
            Evolução: <Text style={{ color: evolutionColor, fontWeight: '600' }}>{evolutionLabel}</Text>
          </Text>
        </View>

        <View className="justify-center items-center">
          <CircleArrowRightIcon size={50} color="#66758A" />
        </View>
      </View>
    </Pressable>
  );
}