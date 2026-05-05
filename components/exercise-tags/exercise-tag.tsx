import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface TagProps {
  label: string;
  height?: number;
  borderRadius?: number;
  isActive?: boolean;
}

const ExerciseTag = ({
  label,
  height = 30,
  borderRadius = 15,
  isActive = false,
}: TagProps) => {
  return (
    <TouchableOpacity
      className='justify-center border items-center'
      style={{
        height,
        borderRadius,
        paddingHorizontal: 15,
        backgroundColor: isActive ? '#1A2836' : '#1B1F27',
        borderColor: isActive ? '#0E89E5' : '#2B303B',
      }}
    >
      <Text
        className='text-center text-sm leading-5'
        style={{
          color: isActive ? '#FFFFFF' : '#66758A',
          fontFamily: 'Inter_500Medium',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ExerciseTag;
