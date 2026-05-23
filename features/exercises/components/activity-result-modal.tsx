import { colors } from "@/assets/colors";
import { RipplePressable } from "@/components/ripple-pressable";
import { SelectableChip } from "@/components/selectable-chip";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NivelDesenvolvimento = "inicial" | "intermediario" | "maduro";
export type RegistroAjuda = "autonomo" | "ajuda_intrusiva";
export type SubCategoria = "verbal" | "modelo";

/**
 * Dados de resultado registrados pelo monitor ao final de uma execução.
 */
export type ActivityResultData = {
  nivelDesenvolvimento: NivelDesenvolvimento;
  registroAjuda: RegistroAjuda;
  /** Preenchido apenas quando registroAjuda === "autonomo". */
  subCategorias: SubCategoria[];
};

export type ActivityResultModalProps = {
  visible: boolean;
  exerciseTitle: string;
  /** Tempo decorrido formatado, ex: "00:42". Exibido como subtítulo. */
  elapsedTime?: string;
  onClose: () => void;
  onDefer?: () => void;
  onNotCompleted?: () => void;
  /**
   * Chamado somente após validação bem-sucedida de todos os campos.
   * TODO (implementação real): persistir resultado em execucoes_exercicio.
   */
  onConfirm: (result: ActivityResultData) => void;
};

// ---------------------------------------------------------------------------
// SVG XML Content for faces matching imported SVGs
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

// ---------------------------------------------------------------------------
// Design tokens dos níveis (fiel ao Figma)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Modal de registro de resultado de atividade — layout fiel ao Figma.
 *
 * Cabeçalho: "Resultado da atividade" + botão "Adiar resposta" (amarelo) +
 *            subtítulo "Tempo: XX:XX" + separador horizontal.
 * Seção 1:   Nível de Desenvolvimento — 3 cards com ícone emoji (radio).
 * Seção 2:   Registro de Ajuda — chips lista (Autônomo / Ajuda intrusiva).
 *              Autônomo expande subcategorias Verbal e Modelo (multi-select).
 * Rodapé:    "Não realizada" (vermelho) | "Concluir" (escuro/borda azul).
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
  const [nivel, setNivel] = useState<NivelDesenvolvimento | null>(null);
  const [ajuda, setAjuda] = useState<RegistroAjuda | null>(null);
  const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Reset completo ao fechar/reabrir o modal
  useEffect(() => {
    if (!visible) {
      setNivel(null);
      setAjuda(null);
      setSubCategorias([]);
      setSubmitted(false);
    }
  }, [visible]);

  const handleSelectAjuda = (value: RegistroAjuda) => {
    setAjuda(value);
    // Limpa sub-categorias ao sair de "Autônomo"
    if (value !== "autonomo") setSubCategorias([]);
  };

  /** Toggle multi-select: Verbal e Modelo podem coexistir. */
  const toggleSubCategoria = (id: string) => {
    const sub = id as SubCategoria;
    setSubCategorias((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleConfirm = () => {
    setSubmitted(true);
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

  // Flags de erro — ativas apenas após a primeira tentativa de confirmar
  const nivelError = submitted && nivel === null;
  const ajudaError = submitted && ajuda === null;
  const subError   = submitted && ajuda === "autonomo" && subCategorias.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay — toque fora fecha */}
      <Pressable
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
        onPress={onClose}
      >
        {/* Card do modal */}
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
          {/* ---- Cabeçalho ---- */}
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

            {/* Botão Adiar resposta */}
            <RipplePressable
              onPress={onDefer}
              style={{
                backgroundColor: "#372620",
                borderWidth: 1,
                borderColor: colors.extra,
                borderRadius: 15,
                paddingHorizontal: 10,
                paddingVertical: 5,
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

          {/* Subtítulo — tempo decorrido */}
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

          {/* Separador */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.outline,
              marginVertical: 2,
            }}
          >
            {null}
          </View>

          {/* ----------------------------------------------------------------
              Seção 1 — Nível de Desenvolvimento
          ---------------------------------------------------------------- */}
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

            {/* 3 cards em linha */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {NIVEIS.map((item) => {
                const isSelected = nivel === item.id;
                const hasErr = nivelError && !isSelected;
                return (
                  <RipplePressable
                    key={item.id}
                    onPress={() => setNivel(item.id)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 15,
                      paddingHorizontal: 10,
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
                    {/* Círculo colorido com emoji SVG */}
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
                Selecione um nível de desenvolvimento.
              </Text>
            )}
          </View>

          {/* ----------------------------------------------------------------
              Seção 2 — Registro de Ajuda
          ---------------------------------------------------------------- */}
          <View style={{ gap: 8 }}>
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
              {/* Autônomo — expande Verbal/Modelo ao ser selecionado */}
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

          {/* ---- Rodapé: botões de ação ---- */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            {/* Não realizada — vermelho com sombra vermelha */}
            <RipplePressable
              onPress={onNotCompleted}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.error,
                shadowColor: "rgba(255,0,0,0.25)",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: 6,
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

            {/* Concluir — escuro com sombra azul */}
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
                shadowColor: "rgba(14,137,229,0.25)",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: 6,
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
