import { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearScaleQuestion } from './form-types';
import { DefaultTextInput } from '../default-text-input';

interface Props {
  question: LinearScaleQuestion;
}

export function LinearScaleQuestionUI({ question }: Props) {
  const [selectedValue, setSelectedValue] = useState<number>(question.min);
  const [textValue, setTextValue] = useState<string>(String(question.min));

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9-]/g, '');
    setTextValue(numericText);
  };

  const handleBlur = () => {
    let val = Math.round(Number(textValue));
    
    if (isNaN(val) || val < question.min) val = question.min;
    if (val > question.max) val = question.max;
    
    setTextValue(String(val));
    setSelectedValue(val);
  };

  const handleSliderChange = (val: number) => {
    const rounded = Math.round(val);
    setSelectedValue(rounded);
    setTextValue(String(rounded));
  };

  return (
    <View className="self-stretch flex flex-col items-center mt-2">
      <View className="flex flex-row justify-between items-center self-stretch px-2 mb-2">
        <Text className="text-muted text-default-2">{question.min}</Text>
        
        <DefaultTextInput
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          className="text-primary text-header-2 text-center w-20 py-2"
        />
        
        <Text className="text-muted text-default-2">{question.max}</Text>
      </View>
      
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={question.min}
        maximumValue={question.max}
        step={1}
        value={selectedValue}
        onValueChange={handleSliderChange}
        minimumTrackTintColor="#0E89E5"
        maximumTrackTintColor="#2B303B"
        thumbTintColor="#FFFFFF"
      />
    </View>
  );
}