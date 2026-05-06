import { useState, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { DropdownQuestion } from './form-types';
import { DropdownModal } from '../dropdown-modal';
import { DefaultTextInput } from '../default-text-input';

interface Props {
  question: DropdownQuestion;
}

export function DropdownQuestionUI({ question }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  
  const [modalLayout, setModalLayout] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<View>(null);

  const options = question.allowOther ? [...question.options, 'Outro'] : question.options;

  const handleSelect = (opt: string) => {
    if (opt === '') {
      setSelected(null);
      setOtherText('');
    } else {
      setSelected(opt);
    }
  };

  const openModal = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setModalLayout({ top: pageY, left: pageX, width });
      setIsOpen(true);
    });
  };

  return (
    <View className="self-stretch flex flex-col mt-2">
      <View ref={buttonRef} collapsable={false} className="self-stretch">
        <Pressable 
          onPress={openModal}
          className="self-stretch px-4 min-h-[44px] bg-level1 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline flex flex-row justify-between items-center"
        >
          <Text className={selected ? "text-white text-default-2" : "text-muted text-default-2"}>
            {selected || 'Selecione aqui'}
          </Text>
          <ChevronDown color="#66758A" size={20} />
        </Pressable>
      </View>

      <DropdownModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        options={options}
        selectedValue={selected}
        layout={modalLayout}
      />

      {selected === 'Outro' && (
        <DefaultTextInput
          value={otherText}
          onChangeText={setOtherText}
          placeholder="Especifique..."
          className="mt-2 min-h-[44px]"
        />
      )}
    </View>
  );
}