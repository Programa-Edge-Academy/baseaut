import { View, Text } from 'react-native';
import { FormQuestionProps } from './form-types';
import { OpenQuestionUI } from './open-question';
import { YesNoQuestionUI } from './yes-no-question';
import { ChoiceListQuestionUI } from './choice-list-question';
import { DropdownQuestionUI } from './dropdown-question';
import { LinearScaleQuestionUI } from './linear-scale-question';
import { MatrixQuestionUI } from './matrix-question';

interface Props {
  question: FormQuestionProps;
  isSubQuestion?: boolean;
}

export function FormQuestion({ question, isSubQuestion = false }: Props) {
  const renderQuestionUI = () => {
    switch (question.type) {
      case 'open': return <OpenQuestionUI />;
      case 'yes_no': return <YesNoQuestionUI question={question} />;
      case 'choice_list': return <ChoiceListQuestionUI question={question} />;
      case 'dropdown': return <DropdownQuestionUI question={question} />;
      case 'linear_scale': return <LinearScaleQuestionUI question={question} />;
      case 'matrix': return <MatrixQuestionUI question={question} />;
      default: return null;
    }
  };

  const content = (
    <>
      <View className="self-stretch px-3.5 py-2.5 rounded-[10px] flex flex-row justify-start items-center gap-2.5">
        <Text className="flex-1 text-white text-default-2">
          {question.title}
        </Text>
      </View>
      {renderQuestionUI()}
    </>
  );

  if (isSubQuestion) {
    return <View className="self-stretch flex flex-col gap-2 mt-4">{content}</View>;
  }

  return (
    <View className="w-full p-[15px] bg-level2 rounded-2xl shadow-panelShadow outline outline-1 outline-offset-[-1px] outline-outline flex flex-col justify-start items-start gap-2">
      {content}
    </View>
  );
}