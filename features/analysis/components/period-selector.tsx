import { colors } from "@/assets/colors";
import { Calendar } from "lucide-react-native";
import React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";

export type PeriodSelectorProps = {
  label?: string;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PeriodSelector({ label = "Selecione o período para visualizar o progresso", onPress, containerStyle }: PeriodSelectorProps) {
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className="w-auto flex-row items-center rounded-lg border border-outline bg-level2 py-3 px-4 pr-6"
      style={[{ marginVertical: 8, marginHorizontal: 22 }, containerStyle]}
    >
      <View className="mr-3">
        <Calendar size={20} color={colors.muted} strokeWidth={2} />
      </View>

      <Text className="text-xs text-white font-medium">{label}</Text>
    </Container>
  );
}

export default PeriodSelector;
