import { AppModal } from "@/components/app-modal";
import { KeyboardAwareScrollView } from "@/components/keyboard-aware-scroll-view";
import { colors } from "@/assets/colors";
import { ActionButtons } from "@/components/action-buttons";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DefaultButton } from "@/components/default-button";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { SpotlightBinding } from "@/features/tutorial/components/spotlight-binding";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { ImageUp, Pencil, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
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
  /** How many times the exercise is performed in a session. Optional. */
  repetitions: number | null;
  /** Every main tag with its subtags: one to three of each. */
  tags: Record<string, string[]>;
};

/** Largest number of main tags an exercise may carry. */
const MAX_TAGS = 3;

/** Largest number of subtags each main tag may carry. */
const MAX_SUBTAGS = 3;

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
  title,
  initialData,
}: NewExerciseProps) {
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const sim = useTutorialSimulation();
  const nameFieldRef = useRef<View>(null);
  const tagFieldRef = useRef<View>(null);
  const saveFieldRef = useRef<View>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repetitionsInput, setRepetitionsInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubtags, setSelectedSubtags] = useState<Record<string, string[]>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [deletePhotoModalVisible, setDeletePhotoModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({ name: "", tag: "", repetitions: "" });

  const availableSubtags = ["locomotor", "manipulativo", "estabilizador"];

  useEffect(() => {
    if (!visible) return;
    setDeletePhotoModalVisible(false);
    setIsPreviewVisible(false);
    setIsSaving(false);
    setErrors({ name: "", tag: "", repetitions: "" });
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setRepetitionsInput(
      initialData?.repetitions ? String(initialData.repetitions) : "",
    );
    setSelectedTags(Object.keys(initialData?.tags ?? {}));
    setSelectedSubtags(initialData?.tags ?? {});
    setPhotoUri(initialData?.iconUrl ?? null);
    // Sync only when the modal opens. `initialData` is rebuilt on every parent
    // render, so depending on it would re-seed the form mid-edit whenever the
    // parent re-renders — which happens each time the guided simulation
    // advances, silently reverting the user's own edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Advance the guided simulation as the required fields are filled in.
  useEffect(() => {
    if (sim.currentKey === "title" && name.trim().length > 0) {
      sim.complete("title");
    }
  }, [sim, name]);

  useEffect(() => {
    const tag = selectedTags[0];
    const hasSubtag = tag ? (selectedSubtags[tag]?.length ?? 0) > 0 : false;
    if (sim.currentKey === "tag" && tag && hasSubtag) {
      sim.complete("tag");
    }
  }, [sim, selectedTags, selectedSubtags]);

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
    const newErrors = { name: "", tag: "", repetitions: "" };

    const parsed = parseInt(repetitionsInput, 10);
    const hasRepetitions = repetitionsInput.trim().length > 0;

    if (!name.trim()) {
      newErrors.name = t("exercises.form.err.required");
      isValid = false;
    }

    // Only the selected tags count, and each one needs at least one subtag.
    const tags: Record<string, string[]> = {};
    for (const tag of selectedTags.slice(0, MAX_TAGS)) {
      tags[tag] = (selectedSubtags[tag] ?? []).slice(0, MAX_SUBTAGS);
    }
    const tagList = Object.keys(tags);

    if (tagList.length === 0) {
      newErrors.tag = t("exercises.form.err.tagRequired");
      isValid = false;
    } else if (tagList.some((tag) => tags[tag].length === 0)) {
      newErrors.tag = t("exercises.form.err.subtagRequired");
      isValid = false;
    }

    if (name.trim().length > 100) {
      newErrors.name = t("exercises.form.err.nameMax");
      isValid = false;
    }

    if (hasRepetitions && (Number.isNaN(parsed) || parsed < 1 || parsed > 999)) {
      newErrors.repetitions = t("exercises.form.err.repetitions");
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid || isSaving) return;
    setIsSaving(true);

    onSave(
      {
        name: name.trim(),
        description: description.trim(),
        repetitions: hasRepetitions ? parsed : null,
        tags,
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
      <AppModal
        visible={visible}
        onRequestClose={onClose}
        transparent
        animationType="fade"
      >
        {/* Bound from inside the modal so the tap guard treats these as its own. */}
        <SpotlightBinding targetKey="title" viewRef={nameFieldRef} />
        <SpotlightBinding targetKey="tag" viewRef={tagFieldRef} />
        <SpotlightBinding targetKey="save" viewRef={saveFieldRef} />

        <View className="flex-1 justify-center">
          <Pressable
            className="absolute inset-0 bg-black/50"
            onPress={Keyboard.dismiss}
          />
          <View
            className="mx-7 border bg-level2 border-outline rounded-[15px] overflow-hidden"
            style={{ maxHeight: "90%" }}
          >
            <KeyboardAwareScrollView
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ padding: 25, gap: 25 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-header-2 text-content">{title ?? t("exercises.form.createTitle")}</Text>
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
                <View ref={nameFieldRef} collapsable={false} className="gap-2">
                  <Text className="text-muted text-default-1">
                    {t("exercises.form.name")}*
                  </Text>
                  <DefaultTextInput
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder={t("exercises.form.namePlaceholder")}
                    className="h-[44px]"
                    outLineBorderClass={errors.name ? "border-error" : "border-outline"}
                    maxLength={100}
                  />
                  {errors.name ? (
                    <Text className="text-error text-default-3 mt-1 ml-1">
                      {errors.name}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-2">
                  <Text className="text-muted text-default-1">{t("exercises.form.description")}</Text>
                  <DefaultTextInput
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t("exercises.form.descriptionPlaceholder")}
                    className="h-[80px]"
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-muted text-default-1">
                    {t("exercises.form.repetitions")}
                  </Text>
                  <DefaultTextInput
                    value={repetitionsInput}
                    onChangeText={setRepetitionsInput}
                    keyboardType="numeric"
                    placeholder={t("exercises.form.repetitionsPlaceholder")}
                    className="h-[44px]"
                    maxLength={3}
                  />
                  {errors.repetitions ? (
                    <Text className="text-error text-default-3 mt-1 ml-1">
                      {errors.repetitions}
                    </Text>
                  ) : null}
                </View>

                <View ref={tagFieldRef} collapsable={false} className="gap-2">
                  <Text className="text-muted text-default-1">{t("exercises.form.tags")}*</Text>
                  <Text className="text-muted text-default-3">
                    {t("exercises.form.tagsHint")}
                  </Text>
                  <TagGroup
                    availableTags={availableTags}
                    availableSubtags={availableSubtags}
                    mode="multiple"
                    maxTags={MAX_TAGS}
                    maxSubtagsPerTag={MAX_SUBTAGS}
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

                <View className="gap-2 mt-2">
                  <ActionButtons
                    onCancel={onClose}
                    onSave={handleSave}
                    cancelLabel={t("common.cancel")}
                    saveLabel={isSaving ? t("common.saving") : t("common.save")}
                    disabled={isSaving}
                    saveButtonRef={saveFieldRef}
                  />
                </View>
              </View>
            </KeyboardAwareScrollView>
          </View>

          <TutorialSpotlight />
        </View>
      </AppModal>

      <ConfirmationModal
        visible={deletePhotoModalVisible}
        onClose={() => setDeletePhotoModalVisible(false)}
        onConfirm={() => {
          setPhotoUri(null);
          setDeletePhotoModalVisible(false);
        }}
        title={t("exercises.form.removeIconTitle")}
        mode="delete"
      />

      <AppModal
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
              label={t("common.remove")}
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
              label={t("students.form.replace")}
              onPress={() => {
                setIsPreviewVisible(false);
                setTimeout(handlePhotoPress, 300);
              }}
              className="flex-1"
            />
          </View>
        </View>
      </AppModal>
    </>
  );
}
