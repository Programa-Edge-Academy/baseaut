import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { ImageUp, Pencil, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { DefaultTextInput } from "../../../components/default-text-input";
import { TagProps } from "./exercise-tag";
import { TagGroup } from "./tag-group";

/**
 * Form payload for creating or editing an exercise.
 */
export type NewExerciseData = {
  name: string;
  description: string;
  durationSeconds: number;
  tag: string | null;
  subtags: string[];
};

/**
 * Props for the new/edit exercise modal.
 */
export type NewExerciseProps = {
  visible?: boolean;
  borderRadius?: number;
  onClose: () => void;
  availableTags?: string[];
  onSave: (exercise: NewExerciseData, photoUri: string | null) => void;
  title?: string;
  initialData?: NewExerciseData & {
    iconUrl?: string | null;
  };
};

/**
 * Modal for creating or editing an exercise.
 */
export function NewExercise({
  visible = true,
  onClose,
  availableTags = ["Coordenação", "Força", "Equilíbrio"],
  onSave,
  title = "Novo exercício",
  initialData,
}: NewExerciseProps) {
  const { width } = useWindowDimensions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubtags, setSelectedSubtags] = useState<Record<string, string[]>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [deletePhotoModalVisible, setDeletePhotoModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({ name: "", tag: "", duration: "" });

  const availableSubtags = ["locomotor", "manipulativo", "estabilizador"];

  useEffect(() => {
    if (!visible) return;
    setDeletePhotoModalVisible(false);
    setIsPreviewVisible(false);
    setIsSaving(false);
    setErrors({ name: "", tag: "", duration: "" });
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setDurationInput(
      initialData?.durationSeconds ? String(initialData.durationSeconds) : "",
    );
    setSelectedTags(initialData?.tag ? [initialData.tag] : []);
    setSelectedSubtags(initialData?.tag ? { [initialData.tag]: initialData.subtags ?? [] } : {});
    setPhotoUri(initialData?.iconUrl ?? null);
  }, [visible, initialData]);

  /**
   * Opens the image picker and stores the selected photo.
   */
  const handlePhotoPress = async () => {
    const ImagePicker = require("expo-image-picker");
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  /**
   * Validates and submits the exercise form.
   */
  const handleSave = () => {
    let isValid = true;
    const newErrors = { name: "", tag: "", duration: "" };

    const parsed = parseInt(durationInput, 10);
    const seconds = Number.isNaN(parsed) ? 0 : parsed;

    if (!name.trim()) {
      newErrors.name = "Este campo é obrigatório";
      isValid = false;
    }

    const tag = selectedTags.length > 0 ? selectedTags[0] : null;
    const subtags = tag ? (selectedSubtags[tag] || []) : [];

    if (!tag) {
      newErrors.tag = "É obrigatória a seleção de uma tag";
      isValid = false;
    } else if (subtags.length === 0) {
      newErrors.tag = "É obrigatória a seleção de pelo menos uma subtag";
      isValid = false;
    }

    if (name.trim().length > 100) {
      newErrors.name = "O nome deve ter no máximo 100 caracteres";
      isValid = false;
    }

    if (durationInput.trim()) {
      if (Number.isNaN(parsed) || seconds < 0 || seconds > 300) {
        newErrors.duration = "A duração deve ser menor que 300 segundos";
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (!isValid || isSaving) return;
    setIsSaving(true);

    onSave(
      {
        name: name.trim(),
        description: description.trim(),
        durationSeconds: seconds,
        tag: selectedTags.length > 0 ? selectedTags[0] : null,
        subtags: selectedTags.length > 0 ? (selectedSubtags[selectedTags[0]] || []) : [],
      },
      photoUri,
    );
  };

  const handleChangeTags = (tags: string[]) => {
    setSelectedTags(tags);
    if (errors.tag && tags.length > 0) {
      setErrors((prev) => ({ ...prev, tag: "" }));
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        onRequestClose={onClose}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 justify-center p-7">
          <View className="border bg-level2 border-outline rounded-[15px]">
            <View className="p-[25px] gap-[25px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-header-2 text-white">{title}</Text>
                <Pressable onPress={onClose} className="p-1 active:opacity-70">
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
                      onPress={
                        photoUri
                          ? () => setIsPreviewVisible(true)
                          : handlePhotoPress
                      }
                      className="w-24 h-24 bg-level1 border border-outline items-center justify-center rounded-2xl overflow-hidden active:opacity-80"
                    >
                      {photoUri ? (
                        <Image
                          source={{ uri: photoUri }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : (
                        <ImageUp color={colors.muted} size={40} />
                      )}
                    </Pressable>

                    {photoUri && (
                      <View>
                        <View className="absolute -bottom-0 -left-0">
                          <Pressable
                            onPress={handlePhotoPress}
                            className="bg-primary p-1.5 rounded-full border-2 border-level2 active:opacity-70 -bottom-0 -left-0"
                          >
                            <Pencil color="#FFFFFF" size={14} />
                          </Pressable>
                        </View>
                        <View className="absolute -bottom-0 -right-0">
                          <Pressable
                            onPress={() => setDeletePhotoModalVisible(true)}
                            className="bg-error p-1.5 rounded-full border-2 border-level2 active:opacity-70 -bottom-0 -right-0"
                          >
                            <X color="#FFFFFF" size={14} />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View className="gap-[10px]">
                <View className="gap-[2px]">
                  <Text className="text-muted text-default-1">
                    Nome do exercício*
                  </Text>
                  <DefaultTextInput
                    value={name}
                    onChangeText={(val) => {
                      const cleanVal = val.replace(/\d/g, "");
                      setName(cleanVal);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="Ex: Girar bambolê"
                    className="h-[44px]"
                    outLineBorderClass={errors.name ? "border-error" : ""}
                    maxLength={100}
                  />
                  {errors.name ? (
                    <Text className="text-error text-default-3 mt-1 ml-1">
                      {errors.name}
                    </Text>
                  ) : null}
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
                    Duração máxima (segundos)
                  </Text>
                  <DefaultTextInput
                    value={durationInput}
                    onChangeText={setDurationInput}
                    keyboardType="numeric"
                    placeholder="Ex: 120"
                    className="h-[44px]"
                    maxLength={3}
                  />
                  {errors.duration ? (
                    <Text className="text-error text-default-3 mt-1 ml-1">
                      {errors.duration}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-[2px]">
                  <Text className="text-muted text-default-1">Tags*</Text>
                  <TagGroup
                    availableTags={availableTags}
                    availableSubtags={availableSubtags}
                    mode="single"
                    selectedTags={selectedTags}
                    selectedSubtags={selectedSubtags}
                    onChangeTags={handleChangeTags}
                    onChangeSubtags={setSelectedSubtags}
                  />
                  {errors.tag ? (
                    <Text className="text-error text-default-3 mt-1 ml-1">
                      {errors.tag}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-[2px] mt-2">
                  <ActionButtons
                    onCancel={onClose}
                    onSave={handleSave}
                    cancelLabel="Cancelar"
                    saveLabel={isSaving ? "Salvando..." : "Salvar"}
                    disabled={isSaving}
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

      <Modal
        visible={isPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <Pressable
            onPress={() => setIsPreviewVisible(false)}
            className="absolute top-12 right-6 z-50 p-2 active:opacity-70"
          >
            <X color="#FFFFFF" size={32} />
          </Pressable>

          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "60%" }}
              resizeMode="contain"
            />
          )}

          <View className="flex-row gap-4 mt-10 w-full max-w-[342px]">
            <DefaultButton
              label="Remover"
              onPress={() => {
                setPhotoUri(null);
                setIsPreviewVisible(false);
              }}
              bgColorClass="bg-level2"
              isOutline
              hasShadow={false}
              outlineBorderClass="border-error"
              textClassName="text-error"
              className="flex-1"
            />
            <DefaultButton
              label="Substituir"
              onPress={() => {
                setIsPreviewVisible(false);
                setTimeout(handlePhotoPress, 300);
              }}
              className="flex-1"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
