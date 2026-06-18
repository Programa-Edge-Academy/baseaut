import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { Check, Edit2, Frown, Meh, Smile, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";

export type RegistroAjuda =
  | "autonomo"
  | "ajuda_intrusiva"
  | "nao_se_aplica";

export type ActivityRecordItem = {
  id: string;
  title: string;
  durationSeconds: number | null;
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
};

export type ActivityRecordUpdate = {
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
};

type ActivityRecordCardProps = {
  record: ActivityRecordItem;
  onSave?: (
    recordId: string,
    values: ActivityRecordUpdate
  ) => Promise<void> | void;
};

const DEVELOPMENT_OPTIONS: {
  id: NivelDesenvolvimento;
  label: string;
  color: string;
  Icon: typeof Frown;
}[] = [
  {
    id: "inicial",
    label: "Inicial",
    color: colors.error,
    Icon: Frown,
  },
  {
    id: "intermediario",
    label: "Intermediário",
    color: colors.extra,
    Icon: Meh,
  },
  {
    id: "maduro",
    label: "Maduro",
    color: colors.secondary,
    Icon: Smile,
  },
];

const HELP_OPTIONS: {
  id: RegistroAjuda;
  label: string;
}[] = [
  {
    id: "autonomo",
    label: "Autônomo",
  },
  {
    id: "ajuda_intrusiva",
    label: "Intrusivo",
  },
];

export function hasActivityRecordPendency(record: ActivityRecordItem) {
  return (
    record.durationSeconds === null ||
    record.durationSeconds === undefined ||
    !record.nivelDesenvolvimento ||
    !record.registroAjuda
  );
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) {
    return "Não selecionado";
  }

  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function getDevelopmentLabel(value: NivelDesenvolvimento | null) {
  if (value === "inicial") return "Inicial";
  if (value === "intermediario") return "Intermediário";
  if (value === "maduro") return "Maduro";

  return "Não selecionado";
}

function getDevelopmentColor(value: NivelDesenvolvimento | null) {
  if (value === "inicial") return colors.error;
  if (value === "intermediario") return colors.extra;
  if (value === "maduro") return colors.secondary;

  return "#FFFFFF";
}

function getHelpLabel(value: RegistroAjuda | null) {
  if (value === "autonomo") return "Autônomo";
  if (value === "ajuda_intrusiva") return "Intrusivo";
  if (value === "nao_se_aplica") return "Não se aplica";

  return "Não selecionado";
}

export function ActivityRecordCard({ record, onSave }: ActivityRecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDevelopment, setSelectedDevelopment] =
    useState<NivelDesenvolvimento | null>(record.nivelDesenvolvimento);
  const [selectedHelp, setSelectedHelp] = useState<RegistroAjuda | null>(
    record.registroAjuda
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedDevelopment(record.nivelDesenvolvimento);
    setSelectedHelp(record.registroAjuda);
  }, [record.nivelDesenvolvimento, record.registroAjuda]);

  const isPending = useMemo(() => {
    if (isEditing) {
      return (
        record.durationSeconds === null ||
        record.durationSeconds === undefined ||
        !selectedDevelopment ||
        !selectedHelp
      );
    }

    return hasActivityRecordPendency(record);
  }, [isEditing, record, selectedDevelopment, selectedHelp]);

  async function handleSave() {
    try {
      setIsSaving(true);

      await onSave?.(record.id, {
        nivelDesenvolvimento: selectedDevelopment,
        registroAjuda: selectedHelp,
      });

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setSelectedDevelopment(record.nivelDesenvolvimento);
    setSelectedHelp(record.registroAjuda);
    setIsEditing(false);
  }

  return (
    <View style={[styles.card, isPending && styles.pendingCard]}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {record.title}
          </Text>

          <Text style={styles.duration}>
            Duração:{" "}
            <Text
              style={
                record.durationSeconds == null
                  ? styles.missingValue
                  : styles.durationValue
              }
            >
              {formatDuration(record.durationSeconds)}
            </Text>
          </Text>
        </View>

        {isEditing ? (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleCancelEdit}
              disabled={isSaving}
              style={styles.iconButton}
            >
              <X size={18} color={colors.muted} />
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.iconButton, styles.saveButton]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Check size={18} color={colors.primary} />
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Edit2 size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {!isEditing ? (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>
            Nível de desenvolvimento:{" "}
            <Text
              style={[
                styles.infoValue,
                {
                  color: getDevelopmentColor(record.nivelDesenvolvimento),
                },
              ]}
            >
              {getDevelopmentLabel(record.nivelDesenvolvimento)}
            </Text>
          </Text>

          <Text style={styles.infoLabel}>
            Nível de ajuda oferecida:{" "}
            <Text style={styles.helpValue}>
              {getHelpLabel(record.registroAjuda)}
            </Text>
          </Text>
        </View>
      ) : (
        <View style={styles.editContainer}>
          <View style={styles.divider} />

          <Text style={styles.editSectionTitle}>Nível de desenvolvimento</Text>

          <View style={styles.developmentOptionsRow}>
            {DEVELOPMENT_OPTIONS.map((option) => {
              const isSelected = selectedDevelopment === option.id;
              const Icon = option.Icon;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedDevelopment(option.id)}
                  style={[
                    styles.developmentOptionCard,
                    isSelected && styles.developmentOptionCardSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.faceCircle,
                      {
                        backgroundColor: option.color,
                      },
                    ]}
                  >
                    <Icon size={30} color="#FFFFFF" strokeWidth={2.4} />
                  </View>

                  <Text
                    style={[
                      styles.developmentOptionText,
                      isSelected && styles.developmentOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.editSectionTitle}>Nível de ajuda oferecida</Text>

          <View style={styles.helpOptionsContainer}>
            {HELP_OPTIONS.map((option) => {
              const isSelected = selectedHelp === option.id;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedHelp(option.id)}
                  style={[
                    styles.helpOption,
                    isSelected && styles.helpOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.helpOptionText,
                      isSelected && styles.helpOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isPending && (
            <Text style={styles.pendingMessage}>
              Existem informações não selecionadas neste registro.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 18,
    backgroundColor: colors.level2,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  pendingCard: {
    borderColor: colors.extra,
    backgroundColor: withOpacity(colors.extra, 0.1),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  duration: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-Bold",
  },
  durationValue: {
    color: colors.muted,
  },
  missingValue: {
    color: "#FFFFFF",
  },
  editButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.level1,
  },
  saveButton: {
    borderColor: colors.primary,
    backgroundColor: withOpacity(colors.primary, 0.1),
  },
  infoContainer: {
    marginTop: 20,
    gap: 16,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter-Bold",
  },
  infoValue: {
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  helpValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  editContainer: {
    marginTop: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outline,
    marginBottom: 22,
  },
  editSectionTitle: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    marginBottom: 12,
  },
  developmentOptionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 26,
  },
  developmentOptionCard: {
    flex: 1,
    minHeight: 130,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.outline,
    backgroundColor: colors.level1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  developmentOptionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: withOpacity(colors.primary, 0.08),
  },
  faceCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  developmentOptionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "center",
  },
  developmentOptionTextSelected: {
    color: "#FFFFFF",
  },
  helpOptionsContainer: {
    gap: 12,
  },
  helpOption: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.level1,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  helpOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: withOpacity(colors.primary, 0.12),
  },
  helpOptionText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  helpOptionTextSelected: {
    color: "#FFFFFF",
  },
  pendingMessage: {
    color: colors.extra,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter-Bold",
    marginTop: 12,
  },
});