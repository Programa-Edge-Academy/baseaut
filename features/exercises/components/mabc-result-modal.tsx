import { colors } from "@/assets/colors";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import {
  MABC_EXERCISE_CONFIGS,
  MabcExerciseConfig,
} from "../constants/mabc-exercise-configs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva";
export type SubCategoria = "verbal" | "modelo";

export type MabcResultData = {
  nivelDesenvolvimento: NivelDesenvolvimento;
  registroAjuda: RegistroAjuda;
  subCategorias: SubCategoria[];
  scores: Record<string, string>;
};

export interface MabcResultModalProps {
  visible: boolean;
  exerciseName: string;
  circuitType: "mabc_1" | "mabc_2" | "mabc_3";
  onClose: () => void;
  onDefer: () => void;
  onNotCompleted: (motivo: string, descricao?: string) => void;
  onConfirm: (result: MabcResultData) => void;
}

// ---------------------------------------------------------------------------
// SVG XML Content for faces matching Figma designs
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
  { id: "inicial",       label: "Inicial",       svgXml: SAD_FACE_XML, bgColor: "#BE2223" },
  { id: "intermediario", label: "Intermediário",  svgXml: NEUTRAL_FACE_XML, bgColor: "#C49A00" },
  { id: "maduro",        label: "Maduro",         svgXml: SMILE_FACE_XML, bgColor: "#25C125" },
];

const MOTIVOS = [
  "Recusa do aluno",
  "Comportamento disruptivo",
  "Fadiga ou cansaço",
  "Tempo insuficiente",
  "Dificuldade física",
  "Outro",
];

export function MabcResultModal({
  visible,
  exerciseName,
  circuitType,
  onClose,
  onDefer,
  onNotCompleted,
  onConfirm,
}: MabcResultModalProps) {
  const [viewMode, setViewMode] = useState<"result" | "reasons">("result");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Standard form states
  const [nivel, setNivel] = useState<NivelDesenvolvimento | null>(null);
  const [ajuda, setAjuda] = useState<RegistroAjuda | null>(null);
  const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);
  const [outroDescricao, setOutroDescricao] = useState<string>("");

  // Get configuration for current exercise
  const config: MabcExerciseConfig | undefined =
    MABC_EXERCISE_CONFIGS[circuitType]?.[exerciseName];

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (visible) {
      setValues({});
      setErrors({});
      setSubmitted(false);
      setViewMode("result");
      setNivel(null);
      setAjuda(null);
      setSubCategorias([]);
      setSelectedMotivo(null);
      setOutroDescricao("");
    }
  }, [visible]);

  const handleChange = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9.,]/g, "").replace(",", ".");
    setValues((prev) => ({ ...prev, [key]: cleaned }));

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSelectAjuda = (value: RegistroAjuda) => {
    setAjuda(value);
    if (value !== "autonomo") setSubCategorias([]);

    if (errors["ajuda"] || errors["subError"]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next["ajuda"];
        delete next["subError"];
        return next;
      });
    }
  };

  const toggleSubCategoria = (id: string) => {
    const sub = id as SubCategoria;
    setSubCategorias((prev) => {
      const updated = prev.includes(sub)
        ? prev.filter((s) => s !== sub)
        : [...prev, sub];

      if (updated.length > 0 && errors["subError"]) {
        setErrors((errs) => {
          const next = { ...errs };
          delete next["subError"];
          return next;
        });
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    setSubmitted(true);
    if (!config) return;

    const newErrors: Record<string, string> = {};
    let hasValidationError = false;

    // 1. Validate MABC scores
    for (const side of config.sides) {
      for (let tIndex = 0; tIndex < config.trials.length; tIndex++) {
        for (const field of config.fields) {
          const key = `${side.key}_${tIndex}_${field.type}`;
          const val = values[key]?.trim() || "";

          if (!val) {
            newErrors[key] = "Obrigatório";
            hasValidationError = true;
            continue;
          }

          const num = Number(val);
          if (isNaN(num) || num < 0) {
            newErrors[key] = "Inválido";
            hasValidationError = true;
            continue;
          }

          if (field.max !== undefined && num > field.max) {
            newErrors[key] = `Máx ${field.max}`;
            hasValidationError = true;
          }
        }
      }
    }

    // 2. Validate standard fields
    if (nivel === null) {
      newErrors["nivel"] = "Obrigatório";
      hasValidationError = true;
    }
    if (ajuda === null) {
      newErrors["ajuda"] = "Obrigatório";
      hasValidationError = true;
    } else if (ajuda === "autonomo" && subCategorias.length === 0) {
      newErrors["subError"] = "Obrigatório";
      hasValidationError = true;
    }

    if (hasValidationError) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      nivelDesenvolvimento: nivel!,
      registroAjuda: ajuda!,
      subCategorias,
      scores: values,
    });
  };

  const isRegistrarDisabled =
    selectedMotivo === null ||
    (selectedMotivo === "Outro" && outroDescricao.trim() === "");

  const handleConfirmNotCompleted = () => {
    if (isRegistrarDisabled) return;
    if (onNotCompleted && selectedMotivo) {
      onNotCompleted(
        selectedMotivo,
        selectedMotivo === "Outro" ? outroDescricao.trim() : undefined
      );
    }
  };

  // Standard errors checking
  const nivelError = submitted && nivel === null;
  const ajudaError = submitted && ajuda === null;
  const subError = submitted && ajuda === "autonomo" && subCategorias.length === 0;

  if (!config) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.75)",
          }}
          onPress={onClose}
        >
          <Pressable
            style={{
              width: "92%",
              maxHeight: "85%",
              backgroundColor: colors.level2,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.outline,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                  style={{
                    fontFamily: "Inter-Bold",
                    fontSize: 18,
                    color: "#fff",
                  }}
                >
                  {viewMode === "result" ? "Resultado da atividade" : "Não realizada"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.primary,
                    marginTop: 2,
                  }}
                >
                  {exerciseName}
                </Text>
              </View>

              {/* Defer Button - Only visible in result mode */}
              {viewMode === "result" && (
                <RipplePressable
                  onPress={onDefer}
                  style={{
                    backgroundColor: "#372620",
                    borderWidth: 1,
                    borderColor: colors.extra,
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter-Medium",
                      fontSize: 13,
                      color: colors.extra,
                    }}
                  >
                    Adiar resposta
                  </Text>
                </RipplePressable>
              )}
            </View>

            {/* Separator */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.outline,
                marginVertical: 12,
              }}
            />

            {viewMode === "result" ? (
              <>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {/* 1. MABC Numerical Inputs Section */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 14,
                        color: colors.muted,
                        marginBottom: 10,
                      }}
                    >
                      Dados de execução (Escores brutos)
                    </Text>

                    {config.sides.map((side) => (
                      <View key={side.key} style={{ marginBottom: 16 }}>
                        {side.label !== "" && (
                          <Text
                            style={{
                              fontFamily: "Inter-Bold",
                              fontSize: 13,
                              color: "#fff",
                              marginBottom: 8,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {side.label}
                          </Text>
                        )}

                        <View style={{ gap: 10 }}>
                          {config.trials.map((trial, tIndex) => (
                            <View
                              key={trial}
                              style={{
                                backgroundColor: colors.level1,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.outline,
                                padding: 12,
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: "Inter-Bold",
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginBottom: 6,
                                }}
                              >
                                {trial === "T1" ? "Tentativa 1" : "Tentativa 2"}
                              </Text>

                              <View style={{ flexDirection: "row", gap: 10 }}>
                                {config.fields.map((field) => {
                                  const key = `${side.key}_${tIndex}_${field.type}`;
                                  const hasError = !!errors[key];

                                  return (
                                    <View key={field.type} style={{ flex: 1 }}>
                                      <Text
                                        style={{
                                          fontFamily: "Inter-Medium",
                                          fontSize: 12,
                                          color: "#fff",
                                          marginBottom: 4,
                                        }}
                                      >
                                        {field.label}
                                      </Text>
                                      <TextInput
                                        value={values[key] || ""}
                                        onChangeText={(val) => handleChange(key, val)}
                                        placeholder={field.placeholder || "0"}
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType="numeric"
                                        style={{
                                          height: 40,
                                          backgroundColor: colors.level2,
                                          borderColor: hasError
                                            ? colors.error
                                            : colors.outline,
                                          borderWidth: 1,
                                          borderRadius: 8,
                                          paddingHorizontal: 10,
                                          color: "#fff",
                                          fontFamily: "Inter-Medium",
                                          fontSize: 14,
                                        }}
                                      />
                                      {hasError && (
                                        <Text
                                          style={{
                                            fontFamily: "Inter-Medium",
                                            fontSize: 10,
                                            color: colors.error,
                                            marginTop: 2,
                                          }}
                                        >
                                          {errors[key]}
                                        </Text>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Separator */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: colors.outline,
                      marginVertical: 12,
                    }}
                  />

                  {/* 2. Nível de Desenvolvimento Section */}
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 14,
                        color: colors.muted,
                      }}
                    >
                      Nível de desenvolvimento
                    </Text>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {NIVEIS.map((item) => {
                        const isSelected = nivel === item.id;
                        const hasErr = nivelError && !isSelected;
                        return (
                          <RipplePressable
                            key={item.id}
                            onPress={() => {
                              setNivel(item.id);
                              if (errors["nivel"]) {
                                setErrors((errs) => {
                                  const next = { ...errs };
                                  delete next["nivel"];
                                  return next;
                                });
                              }
                            }}
                            style={{
                              flex: 1,
                              alignItems: "center",
                              paddingVertical: 12,
                              paddingHorizontal: 8,
                              gap: 5,
                              borderRadius: 15,
                              borderWidth: 1,
                              borderColor: hasErr
                                ? colors.error
                                : isSelected
                                ? item.bgColor
                                : colors.outline,
                              backgroundColor: isSelected
                                ? `${item.bgColor}22`
                                : hasErr
                                ? "#BE222311"
                                : colors.level2,
                            }}
                          >
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: item.bgColor,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <SvgXml xml={item.svgXml} width={20} height={20} />
                            </View>
                            <Text
                              style={{
                                fontFamily: "Inter-Medium",
                                fontSize: 11,
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

                    {nivelError && (
                      <Text
                        style={{
                          fontFamily: "Inter-Medium",
                          fontSize: 12,
                          color: colors.error,
                        }}
                      >
                        Selecione um nível de desenvolvimento.
                      </Text>
                    )}
                  </View>

                  {/* Separator */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: colors.outline,
                      marginVertical: 12,
                    }}
                  />

                  {/* 3. Registro de Ajuda Section */}
                  <View style={{ gap: 8, marginBottom: 8 }}>
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 14,
                        color: colors.muted,
                      }}
                    >
                      Registro de ajuda
                    </Text>

                    <View style={{ gap: 6 }}>
                      {/* Autônomo */}
                      <SelectableChip
                        label="Autônomo"
                        type="nivelAjuda"
                        isSelected={ajuda === "autonomo"}
                        onToggle={() => handleSelectAjuda("autonomo")}
                        selectedSubOptions={subCategorias}
                        onSelectSubOption={toggleSubCategoria}
                        hasError={ajudaError && ajuda !== "autonomo"}
                        subOptionsHasError={subError}
                      />

                      {/* Ajuda intrusiva */}
                      <SelectableChip
                        label="Ajuda intrusiva"
                        isSelected={ajuda === "ajuda_intrusiva"}
                        onToggle={() => handleSelectAjuda("ajuda_intrusiva")}
                        hasError={ajudaError && ajuda !== "ajuda_intrusiva"}
                      />
                    </View>

                    {ajudaError && (
                      <Text
                        style={{
                          fontFamily: "Inter-Medium",
                          fontSize: 12,
                          color: colors.error,
                        }}
                      >
                        Selecione um registro de ajuda.
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
                        Selecione ao menos uma categoria (Verbal ou Modelo).
                      </Text>
                    )}
                  </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {/* Não realizada - Left button (red) */}
                  <RipplePressable
                    onPress={() => setViewMode("reasons")}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.error,
                      shadowColor: "rgba(255,0,0,0.25)",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 15,
                        color: "#fff",
                      }}
                    >
                      Não realizada
                    </Text>
                  </RipplePressable>

                  {/* Concluir - Right button (dark blue) */}
                  <RipplePressable
                    onPress={handleConfirm}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#1F2933",
                      borderWidth: 1,
                      borderColor: "#2F3A46",
                      shadowColor: "rgba(14,137,229,0.25)",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 15,
                        color: "#fff",
                      }}
                    >
                      Concluir
                    </Text>
                  </RipplePressable>
                </View>
              </>
            ) : (
              <>
                {/* Reasons / Non-completion Selection View */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: "Inter-Medium",
                        fontSize: 14,
                        color: colors.muted,
                      }}
                    >
                      Motivo:
                    </Text>

                    <View style={{ gap: 6 }}>
                      {MOTIVOS.map((motivo) => (
                        <SelectableChip
                          key={motivo}
                          label={motivo}
                          type="motivos"
                          isSelected={selectedMotivo === motivo}
                          onToggle={() => setSelectedMotivo(motivo)}
                        />
                      ))}
                    </View>

                    {/* Additional details text area for "Outro" reason */}
                    {selectedMotivo === "Outro" && (
                      <View style={{ gap: 5, marginTop: 8 }}>
                        <Text
                          style={{
                            fontFamily: "Inter-Medium",
                            fontSize: 14,
                            color: colors.muted,
                          }}
                        >
                          Descrição do motivo:
                        </Text>
                        <TextInput
                          value={outroDescricao}
                          onChangeText={setOutroDescricao}
                          placeholder="Descreva o motivo..."
                          placeholderTextColor={colors.placeholder}
                          multiline
                          numberOfLines={3}
                          style={{
                            backgroundColor: colors.level1,
                            borderColor: colors.outline,
                            borderWidth: 1,
                            borderRadius: 12,
                            padding: 12,
                            color: "#fff",
                            fontFamily: "Inter-Medium",
                            fontSize: 14,
                            textAlignVertical: "top",
                            minHeight: 80,
                          }}
                        />
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Footer Buttons for Reasons Mode */}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                  {/* Back button */}
                  <RipplePressable
                    onPress={() => {
                      setViewMode("result");
                      setSelectedMotivo(null);
                      setOutroDescricao("");
                    }}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
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
                        fontSize: 15,
                        color: colors.muted,
                      }}
                    >
                      Voltar
                    </Text>
                  </RipplePressable>

                  {/* Register button */}
                  <RipplePressable
                    onPress={handleConfirmNotCompleted}
                    disabled={isRegistrarDisabled}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isRegistrarDisabled ? "#1F2933" : colors.primary,
                      borderWidth: 1,
                      borderColor: isRegistrarDisabled ? "#2b303b" : colors.primary,
                      opacity: isRegistrarDisabled ? 0.5 : 1,
                      shadowColor: isRegistrarDisabled ? "transparent" : "rgba(14,137,229,0.25)",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 8,
                      elevation: isRegistrarDisabled ? 0 : 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 15,
                        color: isRegistrarDisabled ? colors.muted : "#fff",
                      }}
                    >
                      Registrar
                    </Text>
                  </RipplePressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
