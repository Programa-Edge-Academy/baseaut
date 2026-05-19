import { FileVideo2Icon, ImageUp, X, Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  Image
} from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { TagProps } from "./exercise-tag";
import { TagGroup } from "./tag-group";
import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { ConfirmationModal } from "@/components/confirmation-modal";

export type NewExerciseData = {
  name: string;
  description: string;
  durationSeconds: number;
  tag: string | null;
};

export type NewExerciseProps = {
  visible?: boolean;
  borderRadius?: number;
  onClose: () => void;
  availableTags?: string[];
  onSave: (exercise: NewExerciseData, photoUri: string | null, videoUri: string | null) => void;
  title?: string;
  initialData?: NewExerciseData & { iconUrl?: string | null, mediaUrl?: string | null };
};

export function NewExercise({
  visible = true,
  onClose,
  borderRadius = 15,
  availableTags = ["Locomotor", "Manipulativo", "Estabilizador"],
  onSave,
  title = "Novo exercício",
  initialData,
}: NewExerciseProps) {
  const { width } = useWindowDimensions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [deletePhotoModalVisible, setDeletePhotoModalVisible] = useState(false);
  const [deleteVideoModalVisible, setDeleteVideoModalVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDeletePhotoModalVisible(false);
    setDeleteVideoModalVisible(false);
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setDurationInput(
      initialData?.durationSeconds ? String(initialData.durationSeconds) : ""
    );
    setSelectedTag(initialData?.tag ?? null);
    setPhotoUri(initialData?.iconUrl ?? null);
    setVideoUri(initialData?.mediaUrl ?? null);
  }, [visible, initialData]);

  const handlePhotoPress = async () => {
    const ImagePicker = require('expo-image-picker');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleVideoPress = async () => {
    const ImagePicker = require('expo-image-picker');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const seconds = parseInt(durationInput, 10) || 0;
    
    onSave(
      {
        name: name.trim(),
        description: description.trim(),
        durationSeconds: seconds,
        tag: selectedTag,
      },
      photoUri,
      videoUri
    );
  };

  const selectTag = (label: string) => {
    setSelectedTag((current) => (current === label ? null : label));
  };

  const tags: TagProps[] = availableTags.map((label) => ({
    label,
    isActive: selectedTag === label,
    onPress: () => selectTag(label),
  }));

  return (
    <>
      <Modal
        visible={visible}
        onRequestClose={handleClose}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 justify-center p-7">
          <View className="border bg-level2 border-outline rounded-[15px]">
            <View className="p-[25px] gap-[25px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-header-2 text-white">{title}</Text>
                <Pressable onPress={handleClose} className="p-1 active:opacity-70">
                  <X color={colors.muted} size={28} />
                </Pressable>
              </View>

              <View
                className="flex-row justify-center"
                style={{ gap: width * (40 / 412) }}
              >
                <View className="items-center">
                  <View className="relative">
                    <Pressable
                      onPress={handlePhotoPress}
                      className="w-24 h-24 bg-level1 border border-outline items-center justify-center rounded-2xl overflow-hidden active:opacity-80"
                    >
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <ImageUp color={colors.muted} size={40} />
                      )}
                    </Pressable>
                    
                    {photoUri && (
                      <Pressable
                        onPress={() => setDeletePhotoModalVisible(true)}
                        className="absolute -top-2 -right-2 bg-error p-1.5 rounded-full border-2 border-level2 active:opacity-70"
                      >
                        <X color="#FFFFFF" size={14} />
                      </Pressable>
                    )}
                  </View>
                </View>

                <View className="items-center">
                  <View className="relative">
                    <Pressable
                      onPress={handleVideoPress}
                      className="w-24 h-24 bg-level1 border border-outline items-center justify-center rounded-2xl overflow-hidden active:opacity-80"
                    >
                      {videoUri ? (
                        <View className="w-full h-full bg-level1 items-center justify-center">
                          <Check color={colors.primary} size={40} />
                          <Text className="text-primary text-xs mt-1 font-bold">Adicionado</Text>
                        </View>
                      ) : (
                        <FileVideo2Icon color={colors.muted} size={40} />
                      )}
                    </Pressable>
                    
                    {videoUri && (
                      <Pressable
                        onPress={() => setDeleteVideoModalVisible(true)}
                        className="absolute -top-2 -right-2 bg-error p-1.5 rounded-full border-2 border-level2 active:opacity-70"
                      >
                        <X color="#FFFFFF" size={14} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>

              {/* Campos de Texto */}
              <View className="gap-[10px]">
                <View className="gap-[2px]">
                  <Text className="text-muted text-default-1">Nome do exercício*</Text>
                  <DefaultTextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Girar bambolê"
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
                  <Text className="text-muted text-default-1">Duração máxima (segundos)</Text>
                  <DefaultTextInput
                    value={durationInput}
                    onChangeText={setDurationInput}
                    keyboardType="numeric"
                    placeholder="Ex: 120"
                    className="h-[44px]"
                  />
                </View>

                <View className="gap-[2px]">
                  <Text className="text-muted text-default-1">Tags*</Text>
                  <TagGroup tags={tags} onAddTag={() => {}} />
                </View>

                <View className="gap-[2px] mt-2">
                  <ActionButtons
                    onCancel={handleClose}
                    onSave={handleSave}
                    cancelLabel="Cancelar"
                    saveLabel="Salvar"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={deletePhotoModalVisible}
        onClose={() => setDeletePhotoModalVisible(false)}
        onConfirm={() => {
          setPhotoUri(null);
          setDeletePhotoModalVisible(false);
        }}
        title="Remover ícone?"
        mode="delete"
      />

      <ConfirmationModal
        visible={deleteVideoModalVisible}
        onClose={() => setDeleteVideoModalVisible(false)}
        onConfirm={() => {
          setVideoUri(null);
          setDeleteVideoModalVisible(false);
        }}
        title="Remover vídeo?"
        mode="delete"
      />
    </>
  );
}