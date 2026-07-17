import { colors as staticColors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { Check, Edit2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";

/** Motor development level recorded for an execution. */
export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";

/** Whether the student performed autonomously, with intrusive help, or not applicable. */
export type RegistroAjuda =
  | "autonomo"
  | "ajuda_intrusiva"
  | "nao_se_aplica";

/** Whether the exercise was performed, not performed, or deferred. */
export type StatusRealizacao = "realizada" | "nao_realizada" | "adiado";

/** Reason an exercise was not completed. */
export type MotivoNaoRealizacao =
  | "recusa_aluno"
  | "comportamento_disruptivo"
  | "fadiga_cansaco"
  | "tempo_insuficiente"
  | "dificuldade_fisica"
  | "outro";

/** A single recorded exercise execution displayed by the card. */
export type ActivityRecordItem = {
  id: string;
  title: string;
  durationSeconds: number | null;
  statusRealizacao: StatusRealizacao | null;
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
  complementosAjuda: string[] | null;
  motivoNaoRealizacao: MotivoNaoRealizacao | null;
  descricaoAdicional?: string | null;
};

/** Edited values submitted when saving an activity record. */
export type ActivityRecordUpdate = {
  statusRealizacao: StatusRealizacao;
  durationSeconds: number | null;
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
  complementosAjuda: string[] | null;
  motivoNaoRealizacao: MotivoNaoRealizacao | null;
  descricaoAdicional: string | null;
};

/** Props for {@link ActivityRecordCard}. */
type ActivityRecordCardProps = {
  record: ActivityRecordItem;
  onSave?: (
    recordId: string,
    values: ActivityRecordUpdate
  ) => Promise<void> | void;
  /** Called when the user opens the inline editor. */
  onStartEdit?: () => void;
  /** Tutorial spotlight key for the button that opens the inline editor. */
  editSpotlightKey?: string;
  /** Tutorial spotlight key for the editor's confirm (save) button. */
  saveSpotlightKey?: string;
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

/** A translator function bound to the active locale. */
type Translate = (key: TranslationKey) => string;

const NIVEIS: {
  id: NivelDesenvolvimento;
  labelKey: TranslationKey;
  svgXml: string;
  bgColor: string;
}[] = [
  { id: "inicial",       labelKey: "analysis.level.inicial",      svgXml: SAD_FACE_XML,     bgColor: staticColors.error },
  { id: "intermediario", labelKey: "analysis.level.intermediario", svgXml: NEUTRAL_FACE_XML, bgColor: staticColors.extra },
  { id: "maduro",        labelKey: "analysis.level.maduro",        svgXml: SMILE_FACE_XML,   bgColor: staticColors.secondary },
];

const MOTIVOS: { id: MotivoNaoRealizacao; labelKey: TranslationKey }[] = [
  { id: "recusa_aluno",             labelKey: "activityResult.motive.refusal" },
  { id: "comportamento_disruptivo", labelKey: "activityResult.motive.disruptive" },
  { id: "fadiga_cansaco",           labelKey: "activityResult.motive.fatigue" },
  { id: "tempo_insuficiente",       labelKey: "activityResult.motive.insufficientTime" },
  { id: "dificuldade_fisica",       labelKey: "activityResult.motive.physicalDifficulty" },
  { id: "outro",                    labelKey: "activityResult.motive.other" },
];

const INFO_LABEL_STYLE = {
  fontSize: 14,
  fontFamily: "Inter-Medium",
} as const;

const INFO_VALUE_STYLE = {
  fontFamily: "Inter-Bold",
  fontSize: 14,
} as const;

/**
 * Returns whether a record is still missing required fields: a reason (and
 * description for "Outro") when not performed, or duration, development level,
 * and help registration when performed.
 */
export function hasActivityRecordPendency(record: ActivityRecordItem) {
  if (record.statusRealizacao === "nao_realizada") {
    if (!record.motivoNaoRealizacao) return true;
    if (
      record.motivoNaoRealizacao === "outro" &&
      !(record.descricaoAdicional && record.descricaoAdicional.trim())
    ) {
      return true;
    }
    return false;
  }
  return (
    record.durationSeconds === null ||
    record.durationSeconds === undefined ||
    !record.nivelDesenvolvimento ||
    !record.registroAjuda
  );
}

/** Formats seconds as mm:ss, or a placeholder when unset. */
function formatDuration(seconds: number | null | undefined, t: Translate) {
  if (seconds === null || seconds === undefined) {
    return t("common.notSelected");
  }
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

/** Returns the display label for a help registration value. */
function getHelpLabel(value: RegistroAjuda | null, t: Translate) {
  if (value === "autonomo") return t("analysis.help.autonomous");
  if (value === "ajuda_intrusiva") return t("analysis.help.intrusive");
  if (value === "nao_se_aplica") return t("activityResult.notApplicable");
  return t("common.notSelected");
}

/** Returns the display label for a non-completion reason. */
function getMotivoLabel(value: MotivoNaoRealizacao | null, t: Translate) {
  const found = MOTIVOS.find((m) => m.id === value);
  return found ? t(found.labelKey) : t("common.notSelected");
}

/**
 * Card that displays a recorded execution and lets the user edit it inline:
 * status, duration, development level, and help (or a reason when not
 * performed). Highlights pending records and blocks saving until complete.
 *
 * @remarks
 * Surfaces and text colors follow the active theme via {@link useThemeColors},
 * so the card reads correctly in both light and dark mode. A pending record uses
 * a transparent background (with the accent border) so it blends into either
 * theme. The development-level accent circles keep their fixed vivid colors.
 *
 * The tutorial spotlight keys are registered on the edit and confirm buttons
 * themselves. The card must not be wrapped in a `SpotlightTarget`: its root
 * carries a bottom margin, which the wrapper would measure as part of the card
 * and draw the ring off-center.
 */
export function ActivityRecordCard({
  record,
  onSave,
  onStartEdit,
  editSpotlightKey,
  saveSpotlightKey,
}: ActivityRecordCardProps) {
  const { t } = useI18n();
  const colors = useThemeColors();
  const sim = useTutorialSimulation();
  const editRef = useRef<View>(null);
  const saveRef = useRef<View>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const keys: string[] = [];
    if (editSpotlightKey) {
      sim.registerTarget(editSpotlightKey, editRef, { rounded: true });
      keys.push(editSpotlightKey);
    }
    if (saveSpotlightKey) {
      sim.registerTarget(saveSpotlightKey, saveRef, { rounded: true });
      keys.push(saveSpotlightKey);
    }
    if (keys.length === 0) return;
    return () => sim.unregisterTarget(keys);
  }, [sim, editSpotlightKey, saveSpotlightKey]);
  const [selectedStatus, setSelectedStatus] = useState<StatusRealizacao>(
    record.statusRealizacao === "nao_realizada" ? "nao_realizada" : "realizada"
  );
  const [selectedDevelopment, setSelectedDevelopment] =
    useState<NivelDesenvolvimento | null>(record.nivelDesenvolvimento);
  const [selectedHelp, setSelectedHelp] = useState<RegistroAjuda | null>(
    record.registroAjuda
  );
  const [selectedComplementos, setSelectedComplementos] = useState<string[]>(
    record.complementosAjuda ?? []
  );
  const [selectedMotivo, setSelectedMotivo] =
    useState<MotivoNaoRealizacao | null>(record.motivoNaoRealizacao);
  const [durationInput, setDurationInput] = useState<string>("");
  const [descricaoInput, setDescricaoInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const syncFromRecord = () => {
    setSelectedStatus(
      record.statusRealizacao === "nao_realizada" ? "nao_realizada" : "realizada"
    );
    setSelectedDevelopment(record.nivelDesenvolvimento);
    setSelectedHelp(record.registroAjuda);
    setSelectedComplementos(record.complementosAjuda ?? []);
    setSelectedMotivo(record.motivoNaoRealizacao);
    setDescricaoInput(record.descricaoAdicional ?? "");
    if (record.durationSeconds === null || record.durationSeconds === undefined) {
      setDurationInput("");
    } else {
      setDurationInput(String(Math.max(0, Math.floor(record.durationSeconds))));
    }
  };

  useEffect(() => {
    syncFromRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    record.statusRealizacao,
    record.nivelDesenvolvimento,
    record.registroAjuda,
    record.complementosAjuda,
    record.motivoNaoRealizacao,
    record.descricaoAdicional,
    record.durationSeconds,
  ]);

  const editedDurationSeconds = useMemo<number | null>(() => {
    if (durationInput.trim() === "") return null;
    return Math.max(0, parseInt(durationInput, 10) || 0);
  }, [durationInput]);

  const isNaoRealizada = isEditing
    ? selectedStatus === "nao_realizada"
    : record.statusRealizacao === "nao_realizada";

  const isPending = useMemo(() => {
    if (!isEditing) return hasActivityRecordPendency(record);
    if (selectedStatus === "nao_realizada") {
      if (!selectedMotivo) return true;
      if (selectedMotivo === "outro" && descricaoInput.trim() === "") return true;
      return false;
    }
    return (
      editedDurationSeconds === null ||
      !selectedDevelopment ||
      !selectedHelp
    );
  }, [
    isEditing,
    record,
    selectedStatus,
    selectedMotivo,
    descricaoInput,
    editedDurationSeconds,
    selectedDevelopment,
    selectedHelp,
  ]);

  async function handleSave() {
    if (isPending || isSaving) return;
    try {
      setIsSaving(true);
      const isNao = selectedStatus === "nao_realizada";
      await onSave?.(record.id, {
        statusRealizacao: selectedStatus,
        durationSeconds: editedDurationSeconds,
        nivelDesenvolvimento: isNao ? null : selectedDevelopment,
        registroAjuda: isNao ? null : selectedHelp,
        complementosAjuda:
          !isNao && selectedHelp === "autonomo" && selectedComplementos.length > 0
            ? selectedComplementos
            : null,
        motivoNaoRealizacao: isNao ? selectedMotivo : null,
        descricaoAdicional:
          isNao && selectedMotivo === "outro" ? descricaoInput.trim() : null,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    syncFromRecord();
    setIsEditing(false);
  }

  const nivelData = NIVEIS.find((n) => n.id === record.nivelDesenvolvimento);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: isPending ? colors.extra : colors.outline,
        borderRadius: 18,
        backgroundColor: isPending ? "transparent" : colors.level2,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.content,
              fontSize: 20,
              fontWeight: "700",
              fontFamily: "Inter-Bold",
            }}
          >
            {record.title}
          </Text>
        </View>

        {isEditing ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={handleCancelEdit}
              disabled={isSaving}
              style={{
                width: 38, height: 38,
                alignItems: "center", justifyContent: "center",
                borderRadius: 10, borderWidth: 1,
                borderColor: colors.outline, backgroundColor: colors.level1,
              }}
            >
              <X size={18} color={colors.muted} />
            </Pressable>

            <Pressable
              ref={saveRef}
              collapsable={false}
              onPress={handleSave}
              disabled={isSaving || isPending}
              style={{
                width: 38, height: 38,
                alignItems: "center", justifyContent: "center",
                borderRadius: 10, borderWidth: 1,
                borderColor: isPending ? colors.outline : colors.primary,
                backgroundColor: isPending
                  ? colors.level1
                  : withOpacity(colors.primary, 0.1),
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Check size={18} color={isPending ? colors.muted : colors.primary} />
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            ref={editRef}
            collapsable={false}
            onPress={() => {
              onStartEdit?.();
              setIsEditing(true);
            }}
            style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 }}
          >
            <Edit2 size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {!isEditing && (
        <View style={{ marginTop: 20, gap: 16 }}>
          {isNaoRealizada ? (
            <>
              <Text style={[INFO_LABEL_STYLE, { color: colors.muted }]}>
                {t("activityRecord.status")}:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: colors.error }]}>
                  {t("activityRecord.notPerformed")}
                </Text>
              </Text>

              <Text style={[INFO_LABEL_STYLE, { color: colors.muted }]}>
                {t("activityRecord.reasonLabel")}:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: colors.content }]}>
                  {getMotivoLabel(record.motivoNaoRealizacao, t)}
                  {record.motivoNaoRealizacao === "outro" && record.descricaoAdicional
                    ? ` — ${record.descricaoAdicional}`
                    : ""}
                </Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={[INFO_LABEL_STYLE, { color: colors.muted }]}>
                {t("activityRecord.duration")}:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: colors.content }]}>
                  {formatDuration(record.durationSeconds, t)}
                </Text>
              </Text>

              <Text style={[INFO_LABEL_STYLE, { color: colors.muted }]}>
                {t("activityResult.developmentLevel")}:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: nivelData?.bgColor ?? colors.content }]}>
                  {nivelData ? t(nivelData.labelKey) : t("common.notSelected")}
                </Text>
              </Text>

              <Text style={[INFO_LABEL_STYLE, { color: colors.muted }]}>
                {t("activityRecord.helpLevel")}:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: colors.content }]}>
                  {getHelpLabel(record.registroAjuda, t)}
                  {record.registroAjuda === "autonomo" && (record.complementosAjuda?.length ?? 0) > 0
                    ? ` (${record.complementosAjuda!.map((c) => t(c === "modelo" ? "chip.model" : "chip.verbal")).join(", ")})`
                    : ""}
                </Text>
              </Text>
            </>
          )}
        </View>
      )}

      {isEditing && (
        <View style={{ marginTop: 18 }}>
          <View style={{ height: 1, backgroundColor: colors.outline, marginBottom: 16 }} />

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              {t("activityRecord.exerciseStatus")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([
                { id: "realizada", label: t("activityRecord.performed"), color: colors.secondary },
                { id: "nao_realizada", label: t("activityRecord.notPerformed"), color: colors.error },
              ] as const).map((opt) => {
                const isSelected = selectedStatus === opt.id;
                return (
                  <RipplePressable
                    key={opt.id}
                    onPress={() => setSelectedStatus(opt.id)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? opt.color : colors.outline,
                      backgroundColor: isSelected ? withOpacity(opt.color, 0.12) : colors.level1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 13,
                        color: isSelected ? opt.color : colors.content,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </RipplePressable>
                );
              })}
            </View>
          </View>

          {selectedStatus === "nao_realizada" ? (
            <View style={{ gap: 8, marginTop: 16 }}>
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
                {t("activityRecord.reasonLabel")}
              </Text>
              <View style={{ gap: 5 }}>
                {MOTIVOS.map((m) => (
                  <SelectableChip
                    key={m.id}
                    label={t(m.labelKey)}
                    type="motivos"
                    isSelected={selectedMotivo === m.id}
                    onToggle={() =>
                      setSelectedMotivo((prev) => (prev === m.id ? null : m.id))
                    }
                  />
                ))}
              </View>

              {selectedMotivo === "outro" && (
                <TextInput
                  value={descricaoInput}
                  onChangeText={setDescricaoInput}
                  placeholder={t("activityRecord.describeReason")}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  style={{
                    marginTop: 3,
                    minHeight: 70,
                    textAlignVertical: "top",
                    color: colors.content,
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.outline,
                    backgroundColor: colors.level1,
                    paddingVertical: 11,
                    paddingHorizontal: 14,
                  }}
                />
              )}
            </View>
          ) : (
            <>
              <View style={{ gap: 8, marginTop: 16 }}>
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
                  {t("activityRecord.durationSeconds")}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <TextInput
                    value={durationInput}
                    onChangeText={(text) => setDurationInput(text.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder={t("activityRecord.durationExample")}
                    placeholderTextColor={colors.placeholder}
                    maxLength={5}
                    style={{
                      flex: 1,
                      color: colors.content,
                      fontFamily: "Inter-Bold",
                      fontSize: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.outline,
                      backgroundColor: colors.level1,
                      paddingVertical: 11,
                      paddingHorizontal: 14,
                    }}
                  />
                  <Text style={{ color: colors.content, fontFamily: "Inter-Bold", fontSize: 13, minWidth: 56 }}>
                    {editedDurationSeconds === null ? "--:--" : formatDuration(editedDurationSeconds, t)}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8, marginTop: 16 }}>
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
                  {t("activityResult.developmentLevel")}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {NIVEIS.map((item) => {
                    const isSelected = selectedDevelopment === item.id;
                    return (
                      <RipplePressable
                        key={item.id}
                        onPress={() => setSelectedDevelopment(item.id)}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 15,
                          paddingHorizontal: 10,
                          gap: 5,
                          borderRadius: 15,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? colors.primary : colors.outline,
                          backgroundColor: isSelected ? `${colors.level2}22` : colors.level1,
                        }}
                      >
                        <View
                          style={{
                            width: 50, height: 50, borderRadius: 25,
                            backgroundColor: item.bgColor,
                            alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <SvgXml xml={item.svgXml} width={22} height={22} />
                        </View>
                        <Text
                          style={{
                            fontFamily: "Inter-Medium",
                            fontSize: 12,
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
              </View>

              <View style={{ gap: 8, marginTop: 16 }}>
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
                  {t("activityRecord.helpOffered")}
                </Text>

                <View style={{ gap: 5 }}>
                  <SelectableChip
                    label={t("analysis.help.autonomous")}
                    type="nivelAjuda"
                    isSelected={selectedHelp === "autonomo"}
                    onToggle={() => {
                      if (selectedHelp === "autonomo") {
                        setSelectedHelp(null);
                        setSelectedComplementos([]);
                      } else {
                        setSelectedHelp("autonomo");
                      }
                    }}
                    selectedSubOptions={selectedComplementos}
                    onSelectSubOption={(id) => {
                      setSelectedComplementos((prev) =>
                        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
                      );
                    }}
                  />

                  <SelectableChip
                    label={t("analysis.help.intrusive")}
                    isSelected={selectedHelp === "ajuda_intrusiva"}
                    onToggle={() => {
                      setSelectedHelp("ajuda_intrusiva");
                      setSelectedComplementos([]);
                    }}
                  />
                </View>
              </View>
            </>
          )}

          {isPending && (
            <Text
              style={{
                color: colors.extra,
                fontSize: 12,
                fontWeight: "600",
                fontFamily: "Inter-Bold",
                marginTop: 12,
              }}
            >
              {t("activityRecord.pendingInfo")}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
