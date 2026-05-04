import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface TagProps {
  label: string;
}

const ExerciseTag = ({ label }: TagProps) => {
  return (
    <TouchableOpacity className='w-28 h-7 bg-level1 rounded-2xl border border-primary'>
      <Text
        className="
w-20 h-3.5 text-center justify-center text-Textos-em-destaque text-sm font-medium font-['Inter'] leading-5"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ExerciseTag;
