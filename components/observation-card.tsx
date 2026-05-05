import { View, Text } from 'react-native';

interface ObservationCardProps {
  text?: string;
}

export function ObservationCard({ text }: ObservationCardProps) {
  return (
    <View className="w-full p-3.5 bg-level2 rounded-[15px] outline outline-1 outline-offset-[-1px] outline-outline flex flex-col justify-start items-start gap-2.5">
      <Text className="self-stretch h-5 justify-center text-white text-header-3">
        Observações
      </Text>
      <Text className="self-stretch justify-center text-muted text-default-2">
        {text ? text : 'Nenhuma observação inserida.'}
      </Text>
    </View>
  );
}