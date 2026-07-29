import { AppModal } from "@/components/app-modal";
import { colors as staticColors } from "@/assets/colors";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";

/** Motor development level recorded for a completed activity. */
export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";
/** Whether the student performed the activity autonomously or with intrusive help. */
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva";
/** Help sub-category recorded when the student was autonomous. */
export type SubCategoria = "verbal" | "modelo";

/** Result captured when an activity is completed. */
export type ActivityResultData = {
  nivelDesenvolvimento: NivelDesenvolvimento;
  registroAjuda: RegistroAjuda;
  subCategorias: SubCategoria[];
};

/**
 * What was observed during an activity that was not completed. The level and
 * help are optional here: the attempt is still recorded, but the monitor may
 * have had nothing to assess.
 */
export type ActivityNotCompletedData = {
  motivos: string[];
  descricao?: string;
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
  subCategorias: SubCategoria[];
};

/** Props for {@link ActivityResultModal}. */
export type ActivityResultModalProps = {
  visible: boolean;
  exerciseTitle: string;
  elapsedTime?: string;
  onClose: () => void;
  /** Called to defer the result and answer it later. */
  onDefer?: () => void;
  /** Called when the activity was not completed, with everything observed. */
  onNotCompleted?: (data: ActivityNotCompletedData) => void;
  onConfirm: (result: ActivityResultData) => void;
};

const SAD_FACE_XML = `
<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 15C15 15 13.5 13 11 13C8.5 13 7 15 7 15M8 8H8.01M14 8H14.01M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const NEUTRAL_FACE_XML = `
<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7 14H15M8 8H8.01M14 8H14.01M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const SMILE_FACE_XML = `
<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7 13C7 13 8.5 15 11 15C13.5 15 15 13 15 13M8 8H8.01M14 8H14.01M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const NIVEIS: {
  id: NivelDesenvolvimento;
  labelKey: TranslationKey;
  svgXml: string;
  bgColor: string;
}[] = [
  { id: "inicial",       labelKey: "analysis.level.inicial",       svgXml: SAD_FACE_XML, bgColor: staticColors.error},
  { id: "intermediario", labelKey: "analysis.level.intermediario",  svgXml: NEUTRAL_FACE_XML, bgColor: staticColors.extra },
  { id: "maduro",        labelKey: "analysis.level.maduro",         svgXml: SMILE_FACE_XML, bgColor: staticColors.secondary },
];

/**
 * Reasons for a non-completed activity. `value` is the canonical (Portuguese)
 * string persisted to the backend; `key` provides the localized display label.
 *
 * @remarks
 * "Tempo insuficiente" and "Dificuldade física" were dropped from the options.
 * Their enum values still exist in the database so past records keep reading
 * correctly — they are only gone from what can be picked from now on.
 */
const MOTIVOS: { value: string; key: TranslationKey }[] = [
  { value: "Recusa do aluno", key: "activityResult.motive.refusal" },
  { value: "Comportamento disruptivo", key: "activityResult.motive.disruptive" },
  { value: "Fadiga ou cansaço", key: "activityResult.motive.fatigue" },
  { value: "Outro", key: "activityResult.motive.other" },
];

/**
 * Modal that records the outcome of an in-session activity: motor development
 * level and help registration when completed, or one or more reasons (with an
 * optional description) when not completed. Supports deferring for later.
 *
 * @remarks
 * The not-completed path also captures the level and the help registration, so
 * an attempt that failed still records what was observed. Both stay optional
 * there — unlike the completed path, where they are required — because an
 * activity that never started may have nothing to assess.
 */
export function ActivityResultModal({
  visible,
  exerciseTitle,
  elapsedTime,
  onClose,
  onDefer,
  onNotCompleted,
  onConfirm,
}: ActivityResultModalProps) {
  const colors = useThemeColors();
  const { t } = useI18n();
  const keyboardPadding = useKeyboardPadding();
  const sim = useTutorialSimulation();
  /** Advances the guided simulation only when `key` is the awaited sub-step. */
  const advanceSim = (key: string) => {
    if (sim.active && sim.currentKey === key) sim.complete(key);
  };
  const [viewMode, setViewMode] = useState<"result" | "reasons">("result");
  const [nivel, setNivel] = useState<NivelDesenvolvimento | null>(null);
  const [ajuda, setAjuda] = useState<RegistroAjuda | null>(null);
  const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
  const [selectedMotivos, setSelectedMotivos] = useState<string[]>([]);
  const [outroDescricao, setOutroDescricao] = useState<string>("");

  const [submittedResult, setSubmittedResult] = useState(false);
  const [submittedReasons, setSubmittedReasons] = useState(false);

  useEffect(() => {
    if (!visible) {
      setNivel(null);
      setAjuda(null);
      setSubCategorias([]);
      setSubmittedResult(false);
      setSubmittedReasons(false);
      setViewMode("result");
      setSelectedMotivos([]);
      setOutroDescricao("");
    }
  }, [visible]);

  const handleSelectAjuda = (value: RegistroAjuda) => {
    setAjuda(value);
    if (value !== "autonomo") setSubCategorias([]);
    advanceSim("selectHelp");
  };

  const toggleSubCategoria = (id: string) => {
    const sub = id as SubCategoria;
    setSubCategorias((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleConfirm = () => {
    setSubmittedResult(true);
    const nivelOk = nivel !== null;
    const ajudaOk = ajuda !== null;
    const subOk = ajuda !== "autonomo" || subCategorias.length > 0;

    if (nivelOk && ajudaOk && subOk) {
      advanceSim("conclude");
      onConfirm({
        nivelDesenvolvimento: nivel!,
        registroAjuda: ajuda!,
        subCategorias,
      });
    }
  };

  const toggleMotivo = (value: string) => {
    setSelectedMotivos((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    );
  };

  const handleConfirmNotCompleted = () => {
    setSubmittedReasons(true);

    const isMotivoOk = selectedMotivos.length > 0;
    const hasOutro = selectedMotivos.includes("Outro");
    const isOutroOk = hasOutro ? outroDescricao.trim() !== "" : true;

    if (isMotivoOk && isOutroOk && onNotCompleted) {
      advanceSim("registerNotCompleted");
      onNotCompleted({
        motivos: selectedMotivos,
        descricao: hasOutro ? outroDescricao.trim() : undefined,
        // Recorded when the monitor had something to assess; never required.
        nivelDesenvolvimento: nivel,
        registroAjuda: ajuda,
        subCategorias: ajuda === "autonomo" ? subCategorias : [],
      });
    }
  };

  const nivelError = submittedResult && nivel === null;
  const ajudaError = submittedResult && ajuda === null;
  const subError   = submittedResult && ajuda === "autonomo" && subCategorias.length === 0;

  const hasOutroSelected = selectedMotivos.includes("Outro");
  const motivoError = submittedReasons && selectedMotivos.length === 0;
  const outroError =
    submittedReasons && hasOutroSelected && outroDescricao.trim() === "";

  const isRegistrarApparentDisabled =
    selectedMotivos.length === 0 ||
    (hasOutroSelected && outroDescricao.trim() === "");

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          // Keeps the card above the software keyboard while the "Outro"
          // description is being typed.
          paddingBottom: keyboardPadding,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: "92%",
            maxWidth: 400,
            backgroundColor: colors.level2,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: colors.outline,
            padding: 20,
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter-Bold",
                fontSize: 16,
                color: "#fff",
                flex: 1,
                paddingTop: 4,
              }}
            >
              {t("activityResult.title")}
            </Text>

            <SpotlightTarget
              targetKey={["deferResult", "deferAgain", "deferResumed"]}
            >
              <RipplePressable
                onPress={() => {
                  advanceSim("deferResult");
                  advanceSim("deferAgain");
                  advanceSim("deferResumed");
                  onDefer?.();
                }}
                style={{
                  backgroundColor: "#372620",
                  borderWidth: 1,
                  borderColor: colors.extra,
                  borderRadius: 15,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  zIndex: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.extra,
                  }}
                >
                  {t("activityResult.deferAnswer")}
                </Text>
              </RipplePressable>
            </SpotlightTarget>
          </View>

          {elapsedTime !== undefined && (
            <Text
              style={{
                fontFamily: "Inter-Medium",
                fontSize: 14,
                color: colors.muted,
              }}
            >
              {t("activityResult.time")}: {elapsedTime}
            </Text>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: colors.outline,
              marginVertical: 2,
            }}
          />

          {viewMode === "result" ? (
            <>
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.muted,
                  }}
                >
                  {t("activityResult.developmentLevel")}
                </Text>

                <SpotlightTarget targetKey="selectLevel" style={{ flexDirection: "row", gap: 8 }}>
                  {NIVEIS.map((item) => {
                    const isSelected = nivel === item.id;
                    const hasErr = nivelError && !isSelected;
                    return (
                      <RipplePressable
                        key={item.id}
                        onPress={() => {
                          setNivel(item.id);
                          setSubmittedResult(false);
                          advanceSim("selectLevel");
                        }}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 15,
                          paddingHorizontal: 10,
                          gap: 5,
                          borderRadius: 15,
                          borderWidth: isSelected ? 2 : 1, 
                          borderColor: hasErr
                            ? colors.error
                            : isSelected
                            ? colors.primary
                            : colors.outline,
                          backgroundColor: isSelected
                            ? `${colors.level2}22`
                            : hasErr
                            ? "#BE222311"
                            : colors.level2,
                        }}
                      >
                        <View
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: item.bgColor,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SvgXml xml={item.svgXml} width={22} height={22} />
                        </View>
                        <Text
                          style={{
                            fontFamily: "Inter-Medium",
                            fontSize: 12,
                            color: "#fff",
                            textAlign: "center",
                          }}
                        >
                          {t(item.labelKey)}
                        </Text>
                      </RipplePressable>
                    );
                  })}
                </SpotlightTarget>

                {nivelError && (
                  <Text
                    style={{
                      fontFamily: "Inter-Medium",
                      fontSize: 12,
                      color: colors.error,
                    }}
                  >
                    {t("activityResult.levelRequired")}
                  </Text>
                )}
              </View>

              <View style={{ gap: 8, marginTop: 5 }}>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.muted,
                  }}
                >
                  {t("activityResult.helpRecord")}
                </Text>

                <SpotlightTarget targetKey="selectHelp" style={{ gap: 5 }}>
                  <SelectableChip
                    label={t("analysis.help.autonomous")}
                    type="nivelAjuda"
                    isSelected={ajuda === "autonomo"}
                    onToggle={() => {
                      handleSelectAjuda("autonomo");
                      setSubmittedResult(false);
                    }}
                    selectedSubOptions={subCategorias}
                    onSelectSubOption={(id) => {
                      toggleSubCategoria(id);
                      setSubmittedResult(false);
                    }}
                    hasError={ajudaError && ajuda !== "autonomo"}
                    subOptionsHasError={subError}
                  />

                  <SelectableChip
                    label={t("analysis.help.intrusive")}
                    isSelected={ajuda === "ajuda_intrusiva"}
                    onToggle={() => {
                      handleSelectAjuda("ajuda_intrusiva");
                      setSubmittedResult(false);
                    }}
                    hasError={ajudaError && ajuda !== "ajuda_intrusiva"}
                  />
                </SpotlightTarget>

                {ajudaError && (
                  <Text
                    style={{
                      fontFamily: "Inter-Medium",
                      fontSize: 12,
                      color: colors.error,
                    }}
                  >
                    {t("activityResult.helpRequired")}
                  </Text>
                )}
                {subError && (
                  <Text
                    style={{
                      fontFamily: "Inter-Medium",
                      fontSize: 12,
                      color: colors.error,
                    }}
                  >
                    {t("activityResult.subRequired")}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
                <SpotlightTarget targetKey="markNotCompleted" style={{ flex: 1 }}>
                  <RipplePressable
                    onPress={() => {
                      advanceSim("markNotCompleted");
                      setViewMode("reasons");
                    }}
                    style={{
                      height: 44,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.error,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 16,
                        color: "#fff",
                      }}
                    >
                      {t("activityResult.notCompleted")}
                    </Text>
                  </RipplePressable>
                </SpotlightTarget>

                <SpotlightTarget targetKey="conclude" style={{ flex: 1 }}>
                  <RipplePressable
                    onPress={handleConfirm}
                    style={{
                      height: 44,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.primary,
                      borderWidth: 1,
                      borderColor: "#2F3A46",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 16,
                        color: "#fff",
                      }}
                    >
                      {t("common.done")}
                    </Text>
                  </RipplePressable>
                </SpotlightTarget>
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.muted,
                  }}
                >
                  {t("activityResult.reason")}
                </Text>

                <SpotlightTarget
                  targetKey="selectMotive"
                  style={{
                    gap: 5,
                    padding: motivoError ? 4 : 0,
                    borderWidth: motivoError ? 1 : 0,
                    borderColor: colors.error,
                    borderRadius: 15
                  }}
                >
                  {MOTIVOS.map((motivo) => (
                    <SelectableChip
                      key={motivo.value}
                      label={t(motivo.key)}
                      type="motivos"
                      isSelected={selectedMotivos.includes(motivo.value)}
                      onToggle={() => {
                        advanceSim("selectMotive");
                        toggleMotivo(motivo.value);
                        setSubmittedReasons(false);
                      }}
                    />
                  ))}
                </SpotlightTarget>

                {motivoError && (
                  <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.error }}>
                    {t("activityResult.motiveRequired")}
                  </Text>
                )}

                {hasOutroSelected && (
                  <View style={{ gap: 5, marginTop: 5 }}>
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 14,
                        color: colors.muted,
                      }}
                    >
                      {t("activityResult.motiveDescription")}
                    </Text>
                    <TextInput
                      value={outroDescricao}
                      onChangeText={(text) => {
                        setOutroDescricao(text);
                        setSubmittedReasons(false);
                      }}
                      placeholder={t("activityResult.describeMotive")}
                      placeholderTextColor={colors.placeholder}
                      multiline
                      numberOfLines={3}
                      style={{
                        backgroundColor: colors.level1,
                        borderColor: outroError ? colors.error : colors.outline,
                        borderWidth: 1,
                        borderRadius: 15,
                        padding: 10,
                        color: "#fff",
                        fontFamily: "Inter-Medium",
                        fontSize: 14,
                        textAlignVertical: "top",
                        minHeight: 80,
                      }}
                    />
                    {outroError && (
                      <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.error }}>
                        {t("activityResult.motiveDescRequired")}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* What was observed during the attempt, even without finishing. */}
              <View style={{ gap: 8, marginTop: 15 }}>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.muted,
                  }}
                >
                  {t("activityResult.observedOptional")}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {NIVEIS.map((item) => {
                    const isSelected = nivel === item.id;
                    return (
                      <RipplePressable
                        key={item.id}
                        onPress={() => setNivel(isSelected ? null : item.id)}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 8,
                          gap: 5,
                          borderRadius: 15,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? colors.primary : colors.outline,
                          backgroundColor: colors.level1,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: item.bgColor,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SvgXml xml={item.svgXml} width={18} height={18} />
                        </View>
                        <Text
                          style={{
                            fontFamily: "Inter-Medium",
                            fontSize: 11,
                            color: colors.content,
                            textAlign: "center",
                          }}
                        >
                          {t(item.labelKey)}
                        </Text>
                      </RipplePressable>
                    );
                  })}
                </View>

                <View style={{ gap: 5 }}>
                  <SelectableChip
                    label={t("analysis.help.autonomous")}
                    type="nivelAjuda"
                    isSelected={ajuda === "autonomo"}
                    onToggle={() => {
                      if (ajuda === "autonomo") {
                        setAjuda(null);
                        setSubCategorias([]);
                      } else {
                        setAjuda("autonomo");
                      }
                    }}
                    selectedSubOptions={subCategorias}
                    onSelectSubOption={toggleSubCategoria}
                  />
                  <SelectableChip
                    label={t("analysis.help.intrusive")}
                    isSelected={ajuda === "ajuda_intrusiva"}
                    onToggle={() => {
                      setAjuda(ajuda === "ajuda_intrusiva" ? null : "ajuda_intrusiva");
                      setSubCategorias([]);
                    }}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
                <RipplePressable
                  onPress={() => {
                    setViewMode("result");
                    setSelectedMotivos([]);
                    setOutroDescricao("");
                    setSubmittedReasons(false);
                  }}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.level2,
                    borderWidth: 1,
                    borderColor: colors.outline,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter-Medium",
                      fontSize: 16,
                      color: colors.muted,
                    }}
                  >
                    {t("common.back")}
                  </Text>
                </RipplePressable>

                <SpotlightTarget targetKey="registerNotCompleted" style={{ flex: 1 }}>
                  <RipplePressable
                    onPress={handleConfirmNotCompleted}
                    style={{
                      height: 44,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isRegistrarApparentDisabled ? "#1F2933" : colors.primary,
                      borderWidth: 1,
                      borderColor: isRegistrarApparentDisabled ? "#2b303b" : colors.primary,
                      opacity: isRegistrarApparentDisabled ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 16,
                        color: isRegistrarApparentDisabled ? colors.muted : "#fff",
                      }}
                    >
                      {t("common.register")}
                    </Text>
                  </RipplePressable>
                </SpotlightTarget>
              </View>
            </>
          )}
          {sim.active && <TutorialSpotlight />}
        </Pressable>
      </Pressable>
    </AppModal>
  );
}