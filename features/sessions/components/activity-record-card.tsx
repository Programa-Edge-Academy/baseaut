import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import { Check, Edit2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";

export type RegistroAjuda =
  | "autonomo"
  | "ajuda_intrusiva"
  | "nao_se_aplica";

export type StatusRealizacao = "realizada" | "nao_realizada" | "adiado";

export type MotivoNaoRealizacao =
  | "recusa_aluno"
  | "comportamento_disruptivo"
  | "fadiga_cansaco"
  | "tempo_insuficiente"
  | "dificuldade_fisica"
  | "outro";

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

export type ActivityRecordUpdate = {
  statusRealizacao: StatusRealizacao;
  durationSeconds: number | null;
  nivelDesenvolvimento: NivelDesenvolvimento | null;
  registroAjuda: RegistroAjuda | null;
  complementosAjuda: string[] | null;
  motivoNaoRealizacao: MotivoNaoRealizacao | null;
  descricaoAdicional: string | null;
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

const MOTIVOS: { id: MotivoNaoRealizacao; label: string }[] = [
  { id: "recusa_aluno",             label: "Recusa do aluno" },
  { id: "comportamento_disruptivo", label: "Comportamento disruptivo" },
  { id: "fadiga_cansaco",           label: "Fadiga ou cansaço" },
  { id: "tempo_insuficiente",       label: "Tempo insuficiente" },
  { id: "dificuldade_fisica",       label: "Dificuldade física" },
  { id: "outro",                    label: "Outro" },
];

// ---------------------------------------------------------------------------
// Estilos compartilhados pelas 3 linhas de informação (Duração para baixo):
// mesmo estilo de texto e mesma distância entre si.
// ---------------------------------------------------------------------------

const INFO_LABEL_STYLE = {
  color: colors.muted,
  fontSize: 14,
  fontFamily: "Inter-Medium",
} as const;

const INFO_VALUE_STYLE = {
  fontFamily: "Inter-Bold",
  fontSize: 14,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function hasActivityRecordPendency(record: ActivityRecordItem) {
  // Não realizado: precisa do motivo (e da descrição quando o motivo é "Outro").
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

function getMotivoLabel(value: MotivoNaoRealizacao | null) {
  return MOTIVOS.find((m) => m.id === value)?.label ?? "Não selecionado";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityRecordCard({ record, onSave }: ActivityRecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
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
  // Duração em segundos (campo único); exibida como mm:ss quando salva.
  const [durationInput, setDurationInput] = useState<string>("");
  // Descrição livre exigida quando o motivo for "Outro".
  const [descricaoInput, setDescricaoInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Mantém os campos de edição sincronizados com o registro mais recente.
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

  // Campo único de duração, em segundos (ou null se vazio).
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
      // "Outro" exige uma descrição preenchida.
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
    // Bloqueia o salvamento enquanto houver campos obrigatórios pendentes.
    if (isPending || isSaving) return;
    try {
      setIsSaving(true);
      const isNao = selectedStatus === "nao_realizada";
      await onSave?.(record.id, {
        statusRealizacao: selectedStatus,
        durationSeconds: editedDurationSeconds,
        // Não realizado não carrega nível/ajuda; realizado não carrega motivo.
        nivelDesenvolvimento: isNao ? null : selectedDevelopment,
        registroAjuda: isNao ? null : selectedHelp,
        complementosAjuda:
          !isNao && selectedHelp === "autonomo" && selectedComplementos.length > 0
            ? selectedComplementos
            : null,
        motivoNaoRealizacao: isNao ? selectedMotivo : null,
        // descricao_adicional só faz sentido para o motivo "Outro".
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
        backgroundColor: isPending ? withOpacity(colors.extra, 0.1) : colors.level2,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 16,
      }}
    >
      {/* ---- Header: título + botões de ação ---- */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              color: "#FFFFFF",
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
            onPress={() => setIsEditing(true)}
            style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 }}
          >
            <Edit2 size={22} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* ---- View mode: linhas com mesmo estilo e espaçamento ---- */}
      {!isEditing && (
        <View style={{ marginTop: 20, gap: 16 }}>
          {isNaoRealizada ? (
            <>
              {/* Não realizado: sem duração — apenas status e motivo. */}
              <Text style={INFO_LABEL_STYLE}>
                Status:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: colors.error }]}>
                  Não realizado
                </Text>
              </Text>

              <Text style={INFO_LABEL_STYLE}>
                Motivo:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: "#FFFFFF" }]}>
                  {getMotivoLabel(record.motivoNaoRealizacao)}
                  {record.motivoNaoRealizacao === "outro" && record.descricaoAdicional
                    ? ` — ${record.descricaoAdicional}`
                    : ""}
                </Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={INFO_LABEL_STYLE}>
                Duração:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: "#FFFFFF" }]}>
                  {formatDuration(record.durationSeconds)}
                </Text>
              </Text>

              <Text style={INFO_LABEL_STYLE}>
                Nível de desenvolvimento:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: nivelData?.bgColor ?? "#FFFFFF" }]}>
                  {nivelData?.label ?? "Não selecionado"}
                </Text>
              </Text>

              <Text style={INFO_LABEL_STYLE}>
                Nível de ajuda:{" "}
                <Text style={[INFO_VALUE_STYLE, { color: "#FFFFFF" }]}>
                  {getHelpLabel(record.registroAjuda)}
                  {record.registroAjuda === "autonomo" && (record.complementosAjuda?.length ?? 0) > 0
                    ? ` (${record.complementosAjuda!.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")})`
                    : ""}
                </Text>
              </Text>
            </>
          )}
        </View>
      )}

      {/* ---- Edit mode ---- */}
      {isEditing && (
        <View style={{ marginTop: 18 }}>
          <View style={{ height: 1, backgroundColor: colors.outline, marginBottom: 16 }} />

          {/* Status: Realizado / Não realizado */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
              Status do exercício
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([
                { id: "realizada", label: "Realizado", color: colors.secondary },
                { id: "nao_realizada", label: "Não realizado", color: colors.error },
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
                        color: isSelected ? opt.color : "#FFFFFF",
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
            /* Motivo da não realização */
            <View style={{ gap: 8, marginTop: 16 }}>
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
                Motivo
              </Text>
              <View style={{ gap: 5 }}>
                {MOTIVOS.map((m) => (
                  <SelectableChip
                    key={m.id}
                    label={m.label}
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
                  placeholder="Descreva o motivo"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  style={{
                    marginTop: 3,
                    minHeight: 70,
                    textAlignVertical: "top",
                    color: "#FFFFFF",
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
              {/* Duração editável — campo único, em segundos (só no modo realizado) */}
              <View style={{ gap: 8, marginTop: 16 }}>
                <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: colors.muted }}>
                  Duração (segundos)
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <TextInput
                    value={durationInput}
                    onChangeText={(t) => setDurationInput(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="Ex: 90"
                    placeholderTextColor={colors.placeholder}
                    maxLength={5}
                    style={{
                      flex: 1,
                      color: "#FFFFFF",
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
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter-Bold", fontSize: 13, minWidth: 56 }}>
                    {editedDurationSeconds === null ? "--:--" : formatDuration(editedDurationSeconds)}
                  </Text>
                </View>
              </View>

              {/* Nível de desenvolvimento — igual ao modal */}
              <View style={{ gap: 8, marginTop: 16 }}>
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

              {/* Nível de ajuda — igual ao modal */}
              <View style={{ gap: 8, marginTop: 16 }}>
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
              Existem informações não selecionadas neste registro.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
