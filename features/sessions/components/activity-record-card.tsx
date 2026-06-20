import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import { Check, Edit2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  complementosAjuda: string[] | null;
};

export type ActivityRecordUpdate = {
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
  complementosAjuda: string[] | null;
};

type ActivityRecordCardProps = {
  record: ActivityRecordItem;
  onSave?: (
    recordId: string,
    values: ActivityRecordUpdate
  ) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// SVG faces — same as ActivityResultModal
// ---------------------------------------------------------------------------

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
  label: string;
  svgXml: string;
  bgColor: string;
}[] = [
  { id: "inicial",       label: "Inicial",      svgXml: SAD_FACE_XML,     bgColor: colors.error },
  { id: "intermediario", label: "Intermediário", svgXml: NEUTRAL_FACE_XML, bgColor: colors.extra },
  { id: "maduro",        label: "Maduro",        svgXml: SMILE_FACE_XML,   bgColor: colors.secondary },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function getHelpLabel(value: RegistroAjuda | null) {
  if (value === "autonomo") return "Autônomo";
  if (value === "ajuda_intrusiva") return "Ajuda intrusiva";
  if (value === "nao_se_aplica") return "Não se aplica";
  return "Não selecionado";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityRecordCard({ record, onSave }: ActivityRecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDevelopment, setSelectedDevelopment] =
    useState<NivelDesenvolvimento | null>(record.nivelDesenvolvimento);
  const [selectedHelp, setSelectedHelp] = useState<RegistroAjuda | null>(
    record.registroAjuda
  );
  const [selectedComplementos, setSelectedComplementos] = useState<string[]>(
    record.complementosAjuda ?? []
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedDevelopment(record.nivelDesenvolvimento);
    setSelectedHelp(record.registroAjuda);
    setSelectedComplementos(record.complementosAjuda ?? []);
  }, [record.nivelDesenvolvimento, record.registroAjuda, record.complementosAjuda]);

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
        complementosAjuda:
          selectedHelp === "autonomo" && selectedComplementos.length > 0
            ? selectedComplementos
            : null,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setSelectedDevelopment(record.nivelDesenvolvimento);
    setSelectedHelp(record.registroAjuda);
    setSelectedComplementos(record.complementosAjuda ?? []);
    setIsEditing(false);
  }

  const nivelData = NIVEIS.find((n) => n.id === record.nivelDesenvolvimento);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: isPending ? colors.extra : colors.outline,
        borderRadius: 18,
        backgroundColor: isPending ? withOpacity(colors.extra, 0.1) : colors.level2,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 16,
      }}
    >
      {/* ---- Header: title + duration + action buttons ---- */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: "700",
              fontFamily: "Inter-Bold",
              marginBottom: 4,
            }}
          >
            {record.title}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 16, fontWeight: "600", fontFamily: "Inter-Bold" }}>
            Duração:{" "}
            <Text style={{ color: record.durationSeconds == null ? "#FFFFFF" : colors.muted }}>
              {formatDuration(record.durationSeconds)}
            </Text>
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
              onPress={handleSave}
              disabled={isSaving}
              style={{
                width: 38, height: 38,
                alignItems: "center", justifyContent: "center",
                borderRadius: 10, borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: withOpacity(colors.primary, 0.1),
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Check size={18} color={colors.primary} />
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setIsEditing(true)}
            style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 }}
          >
            <Edit2 size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* ---- View mode ---- */}
      {!isEditing && (
        <View style={{ marginTop: 20, gap: 16 }}>
          <Text style={{ color: colors.muted, fontSize: 14, fontFamily: "Inter-Medium" }}>
            Nível de desenvolvimento:{" "}
            <Text style={{ color: nivelData?.bgColor ?? "#FFFFFF", fontFamily: "Inter-Bold" }}>
              {nivelData?.label ?? "Não selecionado"}
            </Text>
          </Text>

          <Text style={{ color: colors.muted, fontSize: 14, fontFamily: "Inter-Medium" }}>
            Nível de ajuda:{" "}
            <Text style={{ color: "#FFFFFF", fontFamily: "Inter-Bold" }}>
              {getHelpLabel(record.registroAjuda)}
              {record.registroAjuda === "autonomo" && (record.complementosAjuda?.length ?? 0) > 0
                ? ` (${record.complementosAjuda!.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")})`
                : ""}
            </Text>
          </Text>
        </View>
      )}

      {/* ---- Edit mode ---- */}
      {isEditing && (
        <View style={{ marginTop: 18 }}>
          <View style={{ height: 1, backgroundColor: colors.outline, marginBottom: 10 }} />

          {/* Development level — matching modal */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              Nível de desenvolvimento
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
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      {item.label}
                    </Text>
                  </RipplePressable>
                );
              })}
            </View>
          </View>

          {/* Help level — matching modal */}
          <View style={{ gap: 8, marginTop: 15 }}>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              Nível de ajuda oferecida
            </Text>

            <View style={{ gap: 5 }}>
              <SelectableChip
                label="Autônomo"
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
                label="Ajuda intrusiva"
                isSelected={selectedHelp === "ajuda_intrusiva"}
                onToggle={() => {
                  setSelectedHelp("ajuda_intrusiva");
                  setSelectedComplementos([]);
                }}
              />
            </View>
          </View>

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
              Existem informações não selecionadas neste registro.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
