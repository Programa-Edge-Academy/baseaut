import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MatrixQuestion } from './form-types';

interface Props {
  question: MatrixQuestion;
}

export function MatrixQuestionUI({ question }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = (row: string, col: string) => {
    setAnswers((prev) => ({ ...prev, [row]: col }));
  };

  return (
    <View className="self-stretch flex flex-col mt-2">
      <View className="flex flex-row items-center mb-2">
        <View className="flex-1 pr-2" />
        {question.columns.map((col) => (
          <Text key={col} className="w-16 text-center text-muted text-default-3">
            {col}
          </Text>
        ))}
      </View>

      {question.rows.map((row, index) => (
        <View 
          key={row} 
          className={`flex flex-row items-center py-4 ${
            index !== question.rows.length - 1 ? 'border-b border-outline/50' : ''
          }`}
        >
          <Text className="flex-1 text-white text-default-2 pr-2 ml-2">
            {row}
          </Text>
          
          {question.columns.map((col) => {
            const isSelected = answers[row] === col;
            return (
              <View key={col} className="w-16 items-center justify-center">
                <Pressable
                  onPress={() => handleSelect(row, col)}
                  className="w-8 h-8 items-center justify-center"
                >
                  <View 
                    className={`w-6 h-6 rounded-full border-[2px] justify-center items-center ${
                      isSelected ? 'border-primary' : 'border-outline bg-level1'
                    }`}
                  >
                    {isSelected && <View className="w-3 h-3 rounded-full bg-primary" />}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}