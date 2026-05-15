import { FileVideo2Icon, ImageUp, X } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { TagProps } from "./exercise-tag";
import { TagGroup } from "./tag-group";
import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";

export type NewExerciseData = {
  name: string;
  description: string;
  durationSeconds: number;
  tags: string[];
};

export type NewExerciseProps = {
  visible?: boolean;
  borderRadius?: number;
  onClose: () => void;
  availableTags?: string[];
  handlePhotoPress: () => void;
  handleVideoPress: () => void;
  onSave: (exercise: NewExerciseData) => void;
};

export function NewExercise({
  visible = true,
  onClose,
  borderRadius = 15,
  availableTags = ["Coordenação", "Força", "Equilíbrio"],
  handlePhotoPress,
  handleVideoPress,
  onSave,
}: NewExerciseProps) {
  const { width, height } = useWindowDimensions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationInput("");
    setSelectedTags([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const seconds = parseInt(durationInput, 10) || 0;
    onSave({
      name: name.trim(),
      description: description.trim(),
      durationSeconds: seconds,
      tags: selectedTags,
    });
    resetForm();
  };

  const toggleTag = (label: string) => {
    setSelectedTags((current) =>
      current.includes(label)
        ? current.filter((tag) => tag !== label)
        : [...current, label]
    );
  };

  const tags: TagProps[] = availableTags.map((label) => ({
    label,
    isActive: selectedTags.includes(label),
    onPress: () => toggleTag(label),
  }));
  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/50">
        <ScrollView
          className="border bg-level2 border-outline"
          style={{
            borderRadius,
            marginHorizontal: width * 0.02,
            marginVertical: height * 0.11,
          }}
        >
          <View className="p-[25px] gap-[25px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-white">Novo exercício</Text>
              <Pressable onPress={handleClose}>
                <X color={colors.muted} size={30} />
              </Pressable>
            </View>
            <View
              className="flex-row justify-center"
              style={{ gap: width * (65.95 / 412) }}
            >
              <View className="items-start gap-2">
                <Pressable
                  onPress={handlePhotoPress}
                  className="w-[100px] h-[100px] bg-outline items-center justify-center rounded-[15px]"
                >
                  <ImageUp color={colors.muted} size={50} />
                </Pressable>
              </View>
              <View className="items-start gap-2">
                <Pressable
                  onPress={handleVideoPress}
                  className="w-[100px] h-[100px] bg-outline items-center justify-center rounded-[15px]"
                >
                  <FileVideo2Icon color={colors.muted} size={50} />
                </Pressable>
              </View>
            </View>
            <View className="gap-[10px]">
              <View className="gap-[2px]">
                <Text className="text-muted text-default-1">
                  Nome do exercício*
                </Text>
                <DefaultTextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome do exercício"
                  className="h-[44px]"
                />
              </View>
              <View className="gap-[2px]">
                <Text className="text-muted text-default-1">Descrição</Text>
                <DefaultTextInput
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descrição do exercício (opcional)"
                  className="h-[80px]"
                />
              </View>
              <View className="gap-[2px]">
                <Text className="text-muted text-default-1">
                  Duração máxima
                </Text>
                <DefaultTextInput
                  value={durationInput}
                  onChangeText={setDurationInput}
                  keyboardType="numeric"
                  placeholder="Duração máxima do exercício (segundos)"
                  className="h-[44px]"
                />
              </View>
              <View className="gap-[2px]">
                <Text className="text-muted text-default-1">Tags</Text>
                <TagGroup tags={tags} onAddTag={() => {}} />
              </View>
              <View className="gap-[2px]">
                <ActionButtons
                  onCancel={handleClose}
                  onSave={handleSave}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
