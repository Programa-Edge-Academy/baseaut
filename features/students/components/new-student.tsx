import { colors } from "@/assets/colors";
import { DefaultButton } from "@/components/default-button";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { SpotlightBinding } from "@/features/tutorial/components/spotlight-binding";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { Calendar, ChevronDown, ImageUp, Pencil, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/app-modal";
import RangeCalendar from "@/components/range-calendar";
import { Image, Keyboard, Pressable, ScrollView, Text, View } from "react-native";
import { ActionButtons } from "../../../components/action-buttons";
import { ConfirmationModal } from "../../../components/confirmation-modal";
import { DefaultTextInput } from "../../../components/default-text-input";
import { DropdownModal } from "../../../components/dropdown-modal";
import { StudentData } from "../../teams/hooks/use-team-data";

/**
 * Props for the create/edit student modal.
 */
export type NewStudentProps = {
  visible?: boolean;
  mode?: "create" | "edit";
  initialData?: StudentData | null;
  borderRadius?: number;
  onClose: () => void;
  onSave: (data: Partial<StudentData>, photoUri: string | null) => void;
};

/**
 * Modal for creating or editing a student.
 */
export function NewStudent({
  visible,
  mode = "create",
  initialData,
  onClose,
  borderRadius = 15,
  onSave,
}: NewStudentProps) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [supportLevel, setSupportLevel] = useState<string | null>(null);
  const [healthConditions, setHealthConditions] = useState("");
  const [observations, setObservations] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [deletePhotoModalVisible, setDeletePhotoModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const supportLevelRef = useRef<View>(null);
  const [supportLevelLayout, setSupportLevelLayout] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const sim = useTutorialSimulation();
  const nameFieldRef = useRef<View>(null);
  const birthFieldRef = useRef<View>(null);
  const supportFieldRef = useRef<View>(null);
  const saveFieldRef = useRef<View>(null);
  const initialSupportRef = useRef<string | null>(null);

  const supportLevelOptions = [
    t("students.form.supportOption1"),
    t("students.form.supportOption2"),
    t("students.form.supportOption3"),
  ];

  useEffect(() => {
    if (visible) {
      setDeletePhotoModalVisible(false);
      setIsSaving(false);
      if (mode === "edit" && initialData) {
        setFullName(initialData.name);
        setWeight(initialData.weight ? `${initialData.weight} Kg` : "");
        setHeight(initialData.height ? `${initialData.height} cm` : "");
        setWaist(initialData.waist ? `${initialData.waist} cm` : "");
        setSupportLevel(initialData.supportLevel);
        setHealthConditions(initialData.healthConditions || "");
        setObservations(initialData.observations || "");
        setPhotoUri(initialData.avatarUrl);

        if (initialData.birthDate) {
          const [y, m, d] = initialData.birthDate.split("-");
          setBirthDate(`${d}/${m}/${y}`);
        }
      } else {
        setFullName("");
        setBirthDate("");
        setWeight("");
        setHeight("");
        setWaist("");
        setSupportLevel(null);
        setHealthConditions("");
        setObservations("");
        setPhotoUri(null);
      }
      setErrors({});
      initialSupportRef.current =
        mode === "edit" && initialData ? initialData.supportLevel : null;
    }
    // Sync only when the modal opens. `initialData` is rebuilt on every parent
    // render, so depending on it would re-seed the form mid-edit whenever the
    // parent re-renders — which happens each time the guided simulation
    // advances, silently reverting the user's own edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);


  // Advance the guided simulation as each field is filled in.
  useEffect(() => {
    if (sim.currentKey === "name" && fullName.trim().length > 0) {
      sim.complete("name");
    }
  }, [sim, fullName]);

  useEffect(() => {
    if (sim.currentKey === "birthdate" && /^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
      sim.complete("birthdate");
    }
  }, [sim, birthDate]);

  useEffect(() => {
    if (sim.currentKey === "support" && supportLevel) {
      sim.complete("support");
    }
    if (
      sim.currentKey === "editSupport" &&
      supportLevel &&
      supportLevel !== initialSupportRef.current
    ) {
      sim.complete("editSupport");
    }
  }, [sim, supportLevel]);

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
   * Shows the date picker modal.
   */
  const showDatePicker = () => setDatePickerVisibility(true);
  /**
   * Hides the date picker modal.
   */
  const hideDatePicker = () => setDatePickerVisibility(false);

  /**
   * Stores the birth date selected in the calendar (a single day, received as
   * a "YYYY-MM-DD" string) formatted as DD/MM/YYYY.
   */
  const handleConfirmDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    setBirthDate(`${day}/${month}/${year}`);
    if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
    hideDatePicker();
  };

  /**
   * Formats a date string as the user types.
   */
  const handleBirthDateChange = (text: string) => {
    let numericText = text.replace(/\D/g, "");
    if (numericText.length > 8) numericText = numericText.slice(0, 8);
    let formattedText = numericText;
    if (numericText.length > 4) {
      formattedText = `${numericText.slice(0, 2)}/${numericText.slice(2, 4)}/${numericText.slice(4)}`;
    } else if (numericText.length > 2) {
      formattedText = `${numericText.slice(0, 2)}/${numericText.slice(2)}`;
    }
    setBirthDate(formattedText);
    if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: "" }));
  };

  /**
   * Normalizes the weight input on blur.
   */
  const handleWeightBlur = () => {
    const numericWeight = weight.replace(/[^\d.,]/g, "").trim();
    if (numericWeight) setWeight(`${numericWeight} Kg`);
  };

  /**
   * Strips unit suffixes when the weight input gains focus.
   */
  const handleWeightFocus = () => {
    setWeight(weight.replace(/ Kg/g, "").trim());
    if (errors.weight) setErrors((prev) => ({ ...prev, weight: "" }));
  };

  /**
   * Normalizes the height input on blur.
   */
  const handleHeightBlur = () => {
    const numericHeight = height.replace(/[^\d]/g, "").trim();
    if (numericHeight) setHeight(`${numericHeight} cm`);
  };

  /**
   * Strips unit suffixes when the height input gains focus.
   */
  const handleHeightFocus = () => {
    setHeight(height.replace(/ cm/g, "").trim());
    if (errors.height) setErrors((prev) => ({ ...prev, height: "" }));
  };

  /**
   * Normalizes the waist input on blur.
   */
  const handleWaistBlur = () => {
    const numericWaist = waist.replace(/[^\d]/g, "").trim();
    if (numericWaist) setWaist(`${numericWaist} cm`);
  };

  /**
   * Strips unit suffixes when the waist input gains focus.
   */
  const handleWaistFocus = () => {
    setWaist(waist.replace(/ cm/g, "").trim());
    if (errors.waist) setErrors((prev) => ({ ...prev, waist: "" }));
  };

  /**
   * Measures the trigger and opens the support level dropdown.
   */
  const openSupportLevelDropdown = () => {
    const measureAndOpen = () => {
      supportLevelRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setSupportLevelLayout({ top: pageY + height, left: pageX, width });
        setDropdownVisible(true);
      });
    };

    if (Keyboard.isVisible?.()) {
      const sub = Keyboard.addListener("keyboardDidHide", () => {
        sub.remove();
        measureAndOpen();
      });
      Keyboard.dismiss();
    } else {
      measureAndOpen();
    }
  };

  /**
   * Validates form fields and updates errors.
   */
  const validateForm = (): boolean => {
    let newErrors: Record<string, string> = {};

    const nameTrimmed = fullName.trim().replace(/\s+/g, " ");
    if (!nameTrimmed) {
      newErrors.fullName = t("students.form.err.nameRequired");
    } else if (nameTrimmed.length < 3) {
      newErrors.fullName = t("students.form.err.nameMin");
    } else if (nameTrimmed.length > 100) {
      newErrors.fullName = t("students.form.err.nameMax");
    } else if (!nameTrimmed.includes(" ")) {
      newErrors.fullName = t("students.form.err.nameFull");
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = t("students.form.err.dateRequired");
    } else {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (!match) {
        newErrors.birthDate = t("students.form.err.dateInvalid");
      } else {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();

        if (
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() !== month - 1 ||
          dateObj.getDate() !== day ||
          dateObj > today
        ) {
          newErrors.birthDate = t("students.form.err.dateUnreal");
        }

        if (observations.length > 250) {
          newErrors.observations = t("students.form.err.observationsMax");
        }
      }
    }

    if (weight.trim()) {
      const parsedWeight = Number(weight.replace(/[^\d.]/g, ""));
      if (isNaN(parsedWeight) || parsedWeight <= 0)
        newErrors.weight = t("students.form.err.invalidValue");
    }

    if (height.trim()) {
      const parsedHeight = Number(height.replace(/[^\d]/g, ""));
      if (isNaN(parsedHeight) || parsedHeight <= 0)
        newErrors.height = t("students.form.err.invalidValue");
    }

    if (waist.trim()) {
      const parsedWaist = Number(waist.replace(/[^\d]/g, ""));
      if (isNaN(parsedWaist) || parsedWaist <= 0)
        newErrors.waist = t("students.form.err.invalidValue");
    }

    if (!supportLevel) {
      newErrors.supportLevel = t("students.form.err.supportRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validates and prepares student data before saving.
   */
  const handleSaveWrapper = () => {
    if (validateForm() && !isSaving) {
      setIsSaving(true);
      const cleanName = fullName.trim().replace(/\s+/g, " ");
      const [day, month, year] = birthDate.split("/");
      const dbDate = `${year}-${month}-${day}`;

      onSave(
        {
          id: initialData?.id,
          name: cleanName,
          birthDate: dbDate,
          weight: weight.trim() ? Number(weight.replace(/[^\d.]/g, "")) : 0,
          height: height.trim() ? Number(height.replace(/[^\d]/g, "")) : 0,
          waist: waist.trim() ? Number(waist.replace(/[^\d]/g, "")) : 0,
          supportLevel: supportLevel!,
          healthConditions: healthConditions.trim(),
          observations: observations.trim(),
          avatarUrl: initialData?.avatarUrl || null,
        },
        photoUri,
      );
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
        <SpotlightBinding targetKey="name" viewRef={nameFieldRef} />
        <SpotlightBinding targetKey="birthdate" viewRef={birthFieldRef} />
        <SpotlightBinding
          targetKey={["support", "editSupport"]}
          viewRef={supportFieldRef}
        />
        <SpotlightBinding
          targetKey={["save", "editSave"]}
          viewRef={saveFieldRef}
        />

        <View className="flex-1 justify-center">
          <Pressable
            className="absolute inset-0 bg-black/50"
            onPress={Keyboard.dismiss}
          />
          <View
            className="mx-7 border bg-level2 border-outline rounded-[15px] overflow-hidden"
            style={{ maxHeight: "90%" }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 25, gap: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-header-2 text-content">
                  {mode === "edit" ? t("students.form.editTitle") : t("students.form.createTitle")}
                </Text>
                <Pressable onPress={onClose} className="p-1 active:opacity-70">
                  <X color={colors.muted} size={28} />
                </Pressable>
              </View>

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

              <View ref={nameFieldRef} collapsable={false} className="w-full gap-1">
                <Text className="text-default-2 text-muted">
                  {t("students.form.fullName")}*
                </Text>
                <DefaultTextInput
                  placeholder={t("students.form.fullNamePlaceholder")}
                  className="h-11 w-full rounded-[15px]"
                  outLineBorderClass={
                    errors.fullName ? "border-error" : "border-outline"
                  }
                  value={fullName}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/\d/g, "");
                    setFullName(cleanText);
                    if (errors.fullName)
                      setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  maxLength={100}
                />
                {errors.fullName && (
                  <Text className="mt-1 text-default-3 text-error">
                    {errors.fullName}
                  </Text>
                )}
              </View>

              <View ref={birthFieldRef} collapsable={false} className="w-full gap-1">
                <Text className="text-default-2 text-muted">
                  {t("students.form.birthDate")}*
                </Text>
                <View className="flex-row items-center gap-2">
                  <DefaultTextInput
                    placeholder={t("students.form.birthDatePlaceholder")}
                    className="h-11 flex-1 rounded-[15px]"
                    outLineBorderClass={
                      errors.birthDate ? "border-error" : "border-outline"
                    }
                    value={birthDate}
                    onChangeText={handleBirthDateChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <Pressable
                    className="h-11 shrink-0 flex-row items-center gap-2 rounded-[15px] border border-outline bg-level1 px-4 active:opacity-70"
                    onPress={showDatePicker}
                  >
                    <Calendar color={colors.muted} size={20} />
                    <Text className="text-default-2 text-muted" numberOfLines={1}>
                      {t("students.form.calendar")}
                    </Text>
                  </Pressable>
                </View>
                {errors.birthDate && (
                  <Text className="mt-1 text-default-3 text-error">
                    {errors.birthDate}
                  </Text>
                )}

                <AppModal
                  visible={isDatePickerVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={hideDatePicker}
                >
                  <Pressable
                    className="flex-1 items-center justify-center bg-black/60 px-6"
                    onPress={hideDatePicker}
                  >
                    <Pressable
                      className="w-full max-w-[380px]"
                      onPress={(e) => e.stopPropagation()}
                    >
                      <RangeCalendar
                        key={`birth-${isDatePickerVisible}`}
                        mode="single"
                        onRangeSelected={(start) => handleConfirmDate(start)}
                      />
                    </Pressable>
                  </Pressable>
                </AppModal>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-default-2 text-muted">{t("students.form.weight")}</Text>
                  <DefaultTextInput
                    placeholder={t("students.form.weightPlaceholder")}
                    value={weight}
                    onChangeText={(text) => {
                      let valStr = text
                        .replace(/,/g, ".")
                        .replace(/[^\d.]/g, "");
                      if (valStr) {
                        const numericVal = parseFloat(valStr);
                        if (numericVal > 1000) valStr = "1000";
                      }
                      setWeight(valStr);
                    }}
                    onBlur={handleWeightBlur}
                    onFocus={handleWeightFocus}
                    keyboardType="decimal-pad"
                    className="h-11 rounded-[15px]"
                    outLineBorderClass={
                      errors.weight ? "border-error" : "border-outline"
                    }
                  />
                  {errors.weight && (
                    <Text className="mt-1 text-default-3 text-error">
                      {errors.weight}
                    </Text>
                  )}
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-default-2 text-muted">{t("students.form.height")}</Text>
                  <DefaultTextInput
                    placeholder={t("students.form.heightPlaceholder")}
                    value={height}
                    onChangeText={(text) => {
                      let valStr = text.replace(/[^\d]/g, "");
                      if (valStr) {
                        const numericVal = parseInt(valStr, 10);
                        if (numericVal > 300) valStr = "300";
                      }
                      setHeight(valStr);
                    }}
                    onBlur={handleHeightBlur}
                    onFocus={handleHeightFocus}
                    keyboardType="number-pad"
                    className="h-11 rounded-[15px]"
                    outLineBorderClass={
                      errors.height ? "border-error" : "border-outline"
                    }
                  />
                  {errors.height && (
                    <Text className="mt-1 text-default-3 text-error">
                      {errors.height}
                    </Text>
                  )}
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-default-2 text-muted">{t("students.form.waist")}</Text>
                  <DefaultTextInput
                    placeholder={t("students.form.waistPlaceholder")}
                    value={waist}
                    onChangeText={(text) => {
                      let valStr = text.replace(/[^\d]/g, "");
                      if (valStr) {
                        const numericVal = parseInt(valStr, 10);
                        if (numericVal > 350) valStr = "350";
                      }
                      setWaist(valStr);
                    }}
                    onBlur={handleWaistBlur}
                    onFocus={handleWaistFocus}
                    keyboardType="number-pad"
                    className="h-11 rounded-[15px]"
                    outLineBorderClass={
                      errors.waist ? "border-error" : "border-outline"
                    }
                  />
                  {errors.waist && (
                    <Text className="mt-1 text-default-3 text-error">
                      {errors.waist}
                    </Text>
                  )}
                </View>
              </View>

              <View ref={supportFieldRef} collapsable={false} className="w-full gap-1">
                <Text className="text-default-2 text-muted">
                  {t("students.form.supportLevel")}*
                </Text>
                <Pressable
                  ref={supportLevelRef}
                  onPress={openSupportLevelDropdown}
                  className={`h-11 bg-level2 border rounded-[15px] px-4 flex-row items-center justify-between ${errors.supportLevel ? "border-error" : "border-outline"}`}
                >
                  <Text
                    className={`text-default-1 ${supportLevel ? "text-content" : "text-muted"}`}
                  >
                    {supportLevel || t("students.form.selectHere")}
                  </Text>
                  <ChevronDown color={colors.muted} size={20} />
                </Pressable>
                {errors.supportLevel && (
                  <Text className="mt-1 text-default-3 text-error">
                    {errors.supportLevel}
                  </Text>
                )}
              </View>

              <DropdownModal
                visible={dropdownVisible}
                onClose={() => setDropdownVisible(false)}
                onSelect={(val) => {
                  setSupportLevel(val);
                  if (errors.supportLevel)
                    setErrors((prev) => ({ ...prev, supportLevel: "" }));
                }}
                options={supportLevelOptions}
                selectedValue={supportLevel}
                layout={supportLevelLayout}
              />

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">
                  {t("students.form.healthConditions")}
                </Text>
                <DefaultTextInput
                  placeholder={t("students.form.healthConditionsPlaceholder")}
                  className="h-20 rounded-[15px]"
                  multiline
                  maxLength={100}
                  value={healthConditions}
                  onChangeText={setHealthConditions}
                  textAlignVertical="top"
                />
                <Text className="text-muted text-default-3 text-right">
                  {healthConditions.length}/100
                </Text>
              </View>

              <View className="w-full gap-1">
                <Text className="text-default-2 text-muted">{t("students.form.observations")}</Text>
                  <DefaultTextInput
                    placeholder={t("students.form.observationsPlaceholder")}
                    className="h-11 rounded-[15px]"
                    maxLength={250}
                    value={observations}
                    onChangeText={setObservations}
                    outLineBorderClass={errors.observations ? "border-error" : "border-outline"}
                  />
                  <Text className="text-muted text-default-3 text-right">
                    {observations.length}/250
                  </Text>
                  {errors.observations && (
                    <Text className="mt-1 text-default-3 text-error">
                      {errors.observations}
                    </Text>
                  )}
              </View>

              <ActionButtons
                onCancel={onClose}
                onSave={handleSaveWrapper}
                cancelLabel={t("common.cancel")}
                saveLabel={isSaving ? t("common.saving") : t("common.save")}
                disabled={isSaving}
                saveButtonRef={saveFieldRef}
              />
            </ScrollView>
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
        title={t("students.form.removePhotoTitle")}
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
