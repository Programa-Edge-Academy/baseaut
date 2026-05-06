import { View, Pressable } from 'react-native';
import { Mic } from 'lucide-react-native';
import { DefaultTextInput } from '../default-text-input';

export function OpenQuestionUI() {
  const handleRecordAudio = () => {};

  return (
    <View className="self-stretch flex flex-row items-end gap-3 mt-2">
      <DefaultTextInput
        multiline
        className="flex-1 min-h-[44px]"
        placeholder="Responda aqui"
      />
      
      <Pressable 
        onPress={handleRecordAudio}
        className="w-[44px] h-[44px] bg-level1 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline justify-center items-center"
      >
        <Mic color="#66758A" size={20} />
      </Pressable>
    </View>
  );
}