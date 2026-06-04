import React from "react";
import { Modal, Text, View, Pressable, ScrollView } from "react-native";
import { X, ArrowUpDown } from "lucide-react-native";
import { colors } from "@/assets/colors";
import { SessionExercise } from "../screens/session-running-screen";

interface ReorderModalProps {
  visible: boolean;
  items: SessionExercise[];
  currentIndex: number;
  swapIndex: number | null;
  onClose: () => void;
  onItemPress: (index: number) => void;
}

export function ReorderModal({
  visible,
  items,
  currentIndex,
  swapIndex,
  onClose,
  onItemPress,
}: ReorderModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-level2 rounded-t-[32px] p-6 h-[80%] border-t border-outline">
          
          {/* Cabeçalho do Modal */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white text-[24px] font-bold">Mudar ordem</Text>
              <Text className="text-muted text-[14px]">Toque em dois exercícios para trocar</Text>
            </View>
            <Pressable onPress={onClose} className="bg-level1 p-2 rounded-full border border-outline">
              <X size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12 }}>
              {items.map((item, index) => {
                const isSelectedForSwap = swapIndex === index;
                const isCurrent = index === currentIndex;
                const isCompleted = index < currentIndex;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => !isCompleted && onItemPress(index)}
                    disabled={isCompleted} // Não permite trocar o que já foi feito
                    className={`flex-row items-center p-4 rounded-2xl border ${
                      isSelectedForSwap 
                        ? "border-primary bg-primary/10" 
                        : isCurrent 
                          ? "border-secondary bg-secondary/10" 
                          : "border-outline bg-level1"
                    } ${isCompleted ? "opacity-40" : ""}`}
                  >
                    {/* Número da Posição */}
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${
                      isSelectedForSwap ? "bg-primary" : "bg-outline"
                    }`}>
                      <Text className="text-white font-bold">{index + 1}</Text>
                    </View>

                    <View className="flex-1">
                      <Text className={`text-[16px] font-semibold ${
                        isSelectedForSwap ? "text-primary" : "text-white"
                      }`}>
                        {item.name}
                      </Text>
                      {isCurrent && <Text className="text-secondary text-[12px]">Exercício atual</Text>}
                      {isCompleted && <Text className="text-muted text-[12px]">Já realizado</Text>}
                    </View>

                    {!isCompleted && (
                      <ArrowUpDown size={20} color={isSelectedForSwap ? colors.primary : colors.muted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Botão de Fechar no rodapé */}
          <Pressable 
            onPress={onClose}
            className="mt-6 w-full py-4 bg-level1 border border-outline rounded-2xl items-center"
          >
            <Text className="text-white font-bold">Concluir reordenagem</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}