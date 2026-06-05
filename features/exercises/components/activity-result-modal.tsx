import { colors } from "@/assets/colors";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva";
export type SubCategoria = "verbal" | "modelo";

export type ActivityResultData = {
  nivelDesenvolvimento: NivelDesenvolvimento;
  registroAjuda: RegistroAjuda;
  subCategorias: SubCategoria[];
};

export type ActivityResultModalProps = {
  visible: boolean;
  exerciseTitle: string;
  elapsedTime?: string;
  onClose: () => void;
  onDefer?: () => void;
  onNotCompleted?: (motivo: string, descricao?: string) => void;
  onConfirm: (result: ActivityResultData) => void;
};

// ---------------------------------------------------------------------------
// SVG XML Content
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
  { id: "inicial",       label: "Inicial",       svgXml: SAD_FACE_XML, bgColor: colors.error},
  { id: "intermediario", label: "Intermediário",  svgXml: NEUTRAL_FACE_XML, bgColor: colors.extra },
  { id: "maduro",        label: "Maduro",         svgXml: SMILE_FACE_XML, bgColor: colors.secondary },
];

const MOTIVOS = [
  "Recusa do aluno",
  "Comportamento disruptivo",
  "Fadiga ou cansaço",
  "Tempo insuficiente",
  "Dificuldade física",
  "Outro",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityResultModal({
  visible,
  exerciseTitle,
  elapsedTime,
  onClose,
  onDefer,
  onNotCompleted,
  onConfirm,
}: ActivityResultModalProps) {
  const [viewMode, setViewMode] = useState<"result" | "reasons">("result");
  const [nivel, setNivel] = useState<NivelDesenvolvimento | null>(null);
  const [ajuda, setAjuda] = useState<RegistroAjuda | null>(null);
  const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);
  const [outroDescricao, setOutroDescricao] = useState<string>("");
  
  // Controle de submissão para exibir erros nas duas views (US 8.6 e 8.7)
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
      setSelectedMotivo(null);
      setOutroDescricao("");
    }
  }, [visible]);

  const handleSelectAjuda = (value: RegistroAjuda) => {
    setAjuda(value);
    if (value !== "autonomo") setSubCategorias([]);
  };

  const toggleSubCategoria = (id: string) => {
    const sub = id as SubCategoria;
    setSubCategorias((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  // Lógica de Conclusão Positiva (US 8.6)
  const handleConfirm = () => {
    setSubmittedResult(true);
    const nivelOk = nivel !== null;
    const ajudaOk = ajuda !== null;
    const subOk = ajuda !== "autonomo" || subCategorias.length > 0;

    if (nivelOk && ajudaOk && subOk) {
      onConfirm({
        nivelDesenvolvimento: nivel!,
        registroAjuda: ajuda!,
        subCategorias,
      });
    }
  };

  // (US 8.7)
  const handleConfirmNotCompleted = () => {
    setSubmittedReasons(true);
    
    const isMotivoOk = selectedMotivo !== null;
    const isOutroOk = selectedMotivo === "Outro" ? outroDescricao.trim() !== "" : true;

    if (isMotivoOk && isOutroOk && onNotCompleted) {
      onNotCompleted(
        selectedMotivo!,
        selectedMotivo === "Outro" ? outroDescricao.trim() : undefined
      );
    }
  };

  // Flags US 8.6
  const nivelError = submittedResult && nivel === null;
  const ajudaError = submittedResult && ajuda === null;
  const subError   = submittedResult && ajuda === "autonomo" && subCategorias.length === 0;

  // Flags  US 8.7
  const motivoError = submittedReasons && selectedMotivo === null;
  const outroError = submittedReasons && selectedMotivo === "Outro" && outroDescricao.trim() === "";

  // button visual disabled state logic for "Registrar" in US 8.7
  const isRegistrarApparentDisabled = selectedMotivo === null || (selectedMotivo === "Outro" && outroDescricao.trim() === "");

  return (
    <Modal
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
          {/* ---- Header ---- */}
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
              Resultado da atividade
            </Text>

            <RipplePressable
              
              onPress={onDefer}
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
                Adiar resposta
              </Text>
            </RipplePressable>
          </View>

          {elapsedTime !== undefined && (
            <Text
              style={{
                fontFamily: "Inter-Medium",
                fontSize: 14,
                color: colors.muted,
              }}
            >
              Tempo: {elapsedTime}
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
              {/* ---- Section 1 — develop level ---- */}
              <View style={{ gap: 8 }}>
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
                          setSubmittedResult(false); //issue clear 
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
                            ? colors.primary // US 8.6: 
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
                    É obrigatório selecionar um nível de desenvolvimento.
                  </Text>
                )}
              </View>

              {/* ---- Seção 2 — Registro de Ajuda ---- */}
              <View style={{ gap: 8, marginTop: 5 }}>
                <Text
                  style={{
                    fontFamily: "Inter-Medium",
                    fontSize: 14,
                    color: colors.muted,
                  }}
                >
                  Registro de ajuda
                </Text>

                <View style={{ gap: 5 }}>
                  <SelectableChip
                    label="Autônomo"
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
                    label="Ajuda intrusiva"
                    isSelected={ajuda === "ajuda_intrusiva"}
                    onToggle={() => {
                      handleSelectAjuda("ajuda_intrusiva");
                      setSubmittedResult(false);
                    }}
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
                    É obrigatório selecionar um registro de ajuda.
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
                    Selecione pelo menos um complemento: Verbal ou Modelo.
                  </Text>
                )}
              </View>

              {/* ---- Rodapé ---- */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
                <RipplePressable
                  onPress={() => setViewMode("reasons")}
                  style={{
                    flex: 1,
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
                    Não realizada
                  </Text>
                </RipplePressable>

                <RipplePressable
                  onPress={handleConfirm}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#1F2933",
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
                    Concluir
                  </Text>
                </RipplePressable>
              </View>
            </>
          ) : (
            <>
              {/* ---- Seção 3 — Motivos de Não Realização (US 8.7) ---- */}
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

                <View 
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
                      key={motivo}
                      label={motivo}
                      type="motivos"
                      isSelected={selectedMotivo === motivo}
                      onToggle={() => {
                        setSelectedMotivo(motivo);
                        setSubmittedReasons(false); // Remove o erro ao clicar
                      }}
                    />
                  ))}
                </View>

                {motivoError && (
                  <Text style={{ fontFamily: "Inter-Medium", fontSize: 12, color: colors.error }}>
                    Selecione o motivo da não realização.
                  </Text>
                )}

                {selectedMotivo === "Outro" && (
                  <View style={{ gap: 5, marginTop: 5 }}>
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
                      onChangeText={(text) => {
                        setOutroDescricao(text);
                        setSubmittedReasons(false); // Remove o erro ao digitar
                      }}
                      placeholder="Descreva o motivo..."
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
                        Descreva o motivo da não realização.
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* ---- Rodapé Motivos ---- */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
                <RipplePressable
                  onPress={() => {
                    setViewMode("result");
                    setSelectedMotivo(null);
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
                    Voltar
                  </Text>
                </RipplePressable>

                <RipplePressable
                  onPress={handleConfirmNotCompleted}
                  style={{
                    flex: 1,
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
                    Registrar
                  </Text>
                </RipplePressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}