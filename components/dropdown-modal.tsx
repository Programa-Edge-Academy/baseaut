import React from 'react';
import { Modal, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/assets/colors';

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
          className="max-h-[250px] bg-level2 rounded-[10px] border border-outline shadow-panelShadow overflow-hidden z-50"
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
                  className={`px-[12px] min-h-[44px] flex-row items-center justify-between border-b border-outline/50 ${
                    isSelected ? 'bg-[#0E89E5]/15' : ''
                  }`}
                >
                  <Text
                    className="text-default-2 flex-1"
                    style={{
                      color: isSelected ? colors.primary : 'white',
                      fontWeight: isSelected ? '500' : '400'
                    }}
                  >
                    {opt}
                  </Text>
                  {isSelected && (
                    <Check color={colors.primary} size={20} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}