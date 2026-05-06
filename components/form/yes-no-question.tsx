import { useState } from 'react';
import { View } from 'react-native';
import { YesNoQuestion } from './form-types';
import { FormQuestion } from './form-question';
import { DefaultButton } from '../default-button';

interface Props {
  question: YesNoQuestion;
}

export function YesNoQuestionUI({ question }: Props) {
  const [selected, setSelected] = useState<'sim' | 'nao' | null>(null);

  const handleSelect = (option: 'sim' | 'nao') => {
    setSelected((prev) => (prev === option ? null : option));
  };

  const showSubQuestion = 
    (question.subtype === 'conditional_positive' && selected === 'sim') ||
    (question.subtype === 'conditional_negative' && selected === 'nao');

  return (
    <View className="self-stretch flex flex-col mt-2">
      <View className="flex flex-row gap-4">
        <DefaultButton
          label="Não"
          onPress={() => handleSelect('nao')}
          bgColorClass={selected === 'nao' ? 'bg-error' : 'bg-level1'}
          shadowClass={selected === 'nao' ? 'shadow-errorShadow' : ''}
          sizeClass="flex-1 h-[44px]"
          className="rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline"
          textClassName="text-header-3"
        />

        <DefaultButton
          label="Sim"
          onPress={() => handleSelect('sim')}
          bgColorClass={selected === 'sim' ? 'bg-primary' : 'bg-level1'}
          shadowClass={selected === 'sim' ? 'shadow-primaryShadow' : ''}
          sizeClass="flex-1 h-[44px]"
          className="rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline"
          textClassName="text-header-3"
        />
      </View>

      {showSubQuestion && question.subQuestion && (
        <FormQuestion question={question.subQuestion} isSubQuestion={true} />
      )}
    </View>
  );
}