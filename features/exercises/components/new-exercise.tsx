import { FileVideo2Icon, ImageUp, X } from "lucide-react-native";
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

export type NewExerciseProps = {
  visible?: boolean;
  borderRadius?: number;
  onClose: () => void;
  tags: TagProps[];
  handlePhotoPress: () => void;
  handleVideoPress: () => void;
};

export function NewExercise({
  visible,
  onClose,
  borderRadius = 15,
  tags,
  handlePhotoPress,
  handleVideoPress,
}: NewExerciseProps) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/50">
        <ScrollView
          className="border bg-[#1B1F27] border-[#2B303B]"
          style={{
            borderRadius,
            marginHorizontal: width * 0.02,
            marginVertical: height * 0.11,
          }}
        >
          <View className="p-[25px] gap-[25px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-header-2 text-white">Novo Exercício</Text>
              <Pressable onPress={onClose}>
                <X color="#66758A" size={30} />
              </Pressable>
            </View>
            <View
              className="flex-row justify-center"
              style={{ gap: width * (65.95 / 412) }}
            >
              <View className="items-start gap-2">
                <Text className="text-[#66758A] text-default-1">Foto</Text>
                <Pressable
                  onPress={handlePhotoPress}
                  className="w-[100px] h-[100px] bg-[#272C35] items-center justify-center rounded-[15px]"
                >
                  <ImageUp color="#66758A" size={50} />
                </Pressable>
              </View>
              <View className="items-start gap-2">
                <Text className="text-[#66758A] text-default-1">Vídeos</Text>
                <Pressable
                  onPress={handlePhotoPress}
                  className="w-[100px] h-[100px] bg-[#272C35] items-center justify-center rounded-[15px]"
                >
                  <FileVideo2Icon color="#66758A" size={50} />
                </Pressable>
              </View>
            </View>
            <View className="gap-[10px]">
              <View className="gap-[2px]">
                <Text className="text-[#66758A] text-default-1">
                  Novo Exercício*
                </Text>
                <DefaultTextInput
                  placeholder="Nome do exercício"
                  className="h-[44px]"
                />
              </View>
              <View className="gap-[2px]">
                <Text className="text-[#66758A] text-default-1">Descrição</Text>
                <DefaultTextInput
                  placeholder="Descrição do exercício (opcional)"
                  className="h-[80px]"
                />
              </View>
              <View className="gap-[2px]">
                <Text className="text-[#66758A] text-default-1">
                  Duração máxima
                </Text>
                <DefaultTextInput
                  placeholder="Duração máxima do exercício (segundos)"
                  className="h-[44px]"
                />
              </View>
              <View className="gap-[2px]">
                <Text className="text-[#66758A] text-default-1">Tags</Text>
                <TagGroup tags={tags} onAddTag={() => {}} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
