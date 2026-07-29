/** Kind of value captured for a MABC-2 exercise field. */
export type MabcFieldType = "tempo" | "falhas" | "acertos" | "passos";

/** Configuration of a single input field within a MABC-2 exercise. */
export interface MabcFieldConfig {
  type: MabcFieldType;
  label: string;
  /** Maximum accepted value, used for validation. */
  max?: number;
  placeholder?: string;
}

/** A side (e.g. hand/leg) for which an exercise records separate values. */
export interface MabcSideConfig {
  key: string;
  label: string;
}

/** Full configuration of a MABC-2 exercise: its section, sides, trials, and fields. */
export interface MabcExerciseConfig {
  section: "destreza_manual" | "pegar_lancar" | "equilibrio";
  sectionLabel: string;
  sides: MabcSideConfig[];
  trials: string[];
  fields: MabcFieldConfig[];
}

/**
 * MABC-2 exercise field configurations keyed by age band and exercise name,
 * driving the dynamic score inputs in {@link MabcResultModal}.
 */
export const MABC_EXERCISE_CONFIGS: Record<
  "mabc_1" | "mabc_2" | "mabc_3",
  Record<string, MabcExerciseConfig>
> = {
  mabc_1: {
    "Colocar moedas no cofre": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [
        { key: "pref", label: "Mão Preferida" },
        { key: "nao_pref", label: "Mão Não Preferida" },
      ],
      trials: ["T1", "T2"],
      fields: [
        { type: "tempo", label: "Tempo (s)" },
        { type: "falhas", label: "Falhas" },
      ],
    },
    "Entrelaçar cubos com o cordão": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [
        { type: "tempo", label: "Tempo (s)" },
        { type: "falhas", label: "Falhas" },
      ],
    },
    "Desenhar o caminho": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "falhas", label: "Falhas" }],
    },
    "Pegar o saquinho de feijão": {
      section: "pegar_lancar",
      sectionLabel: "Pegar e Lançar",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 10 }],
    },
    "Arremessar o saquinho de feijão no tapete": {
      section: "pegar_lancar",
      sectionLabel: "Pegar e Lançar",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 10 }],
    },
    "Equilíbrio em uma perna só": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [
        { key: "melhor", label: "Melhor Perna" },
        { key: "outra", label: "Outra Perna" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Caminhar na ponta dos pés": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "passos", label: "Passos", max: 15 }],
    },
    "Saltar nos tapetes": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 5 }],
    },
  },
  mabc_2: {
    "Colocar pinos no tabuleiro": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [
        { key: "pref", label: "Mão Preferida" },
        { key: "nao_pref", label: "Mão Não Preferida" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Entrelaçar o cordão": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Desenhar o caminho": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "falhas", label: "Falhas" }],
    },
    "Pegar com as duas mãos": {
      section: "pegar_lancar",
      sectionLabel: "Pegar e Lançar",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 10 }],
    },
    "Arremessar o saquinho de feijão no tapete": {
      section: "pegar_lancar",
      sectionLabel: "Pegar e Lançar",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 10 }],
    },
    "Equilíbrio sobre a prancha": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [
        { key: "melhor", label: "Melhor Perna" },
        { key: "outra", label: "Outra Perna" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Caminhar para frente (Calcanhar-dedos)": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "passos", label: "Passos", max: 15 }],
    },
    "Saltar com um pé nos tapetes": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [
        { key: "melhor", label: "Melhor Perna" },
        { key: "outra", label: "Outra Perna" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 5 }],
    },
  },
  mabc_3: {
    "Virar pinos": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [
        { key: "pref", label: "Mão Preferida" },
        { key: "nao_pref", label: "Mão Não Preferida" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Triângulo com porcas e parafusos": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Desenhar caminho": {
      section: "destreza_manual",
      sectionLabel: "Destreza Manual",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "falhas", label: "Falhas" }],
    },
    "Pegar com uma mão": {
      section: "pegar_lancar",
      sectionLabel: "Pegar e Lançar",
      sides: [
        { key: "melhor", label: "Melhor Mão" },
        { key: "outra", label: "Outra Mão" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 10 }],
    },
    "Arremessar em um alvo na parede": {
      section: "pegar_lancar",
      sectionLabel: "Pegar e Lançar",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 10 }],
    },
    "Equilíbrio sobre duas pranchas": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "tempo", label: "Tempo (s)" }],
    },
    "Caminhar para trás (Dedos-calcanhar)": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [{ key: "default", label: "" }],
      trials: ["T1", "T2"],
      fields: [{ type: "passos", label: "Passos", max: 15 }],
    },
    "Saltar com um pé em Zique-zague": {
      section: "equilibrio",
      sectionLabel: "Equilíbrio",
      sides: [
        { key: "melhor", label: "Melhor Perna" },
        { key: "outra", label: "Outra Perna" },
      ],
      trials: ["T1", "T2"],
      fields: [{ type: "acertos", label: "Acertos", max: 5 }],
    },
  },
};
