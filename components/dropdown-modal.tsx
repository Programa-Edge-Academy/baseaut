import React from 'react';
import { Modal, Text, Pressable, ScrollView } from 'react-native';

interface DropdownModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  options: string[];
  selectedValue: string | null;
  layout: { top: number; left: number; width: number };
}

export function DropdownModal({
  visible,
  onClose,
  onSelect,
  options,
  selectedValue,
  layout,
}: DropdownModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1"
        onPress={onClose}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: layout.top,
            left: layout.left,
            width: layout.width,
          }}
          className="max-h-[250px] bg-level2 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-outline shadow-panelShadow overflow-hidden z-50"
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView showsVerticalScrollIndicator={false} className="w-full">
            {options.map((opt) => {
              const isSelected = selectedValue === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  className={`px-4 min-h-[44px] justify-center border-b border-outline/50 ${
                    isSelected ? 'bg-level1' : ''
                  }`}
                >
                  <Text className={isSelected ? 'text-white text-default-2' : 'text-muted text-default-2'}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}