import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import type { Locale, TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import type { Mabc2Record } from "../components/mabc2-record-card";

/** An editable exercise item within a MABC-2 draft section. */
export type Mabc2DraftExercise = {
  id: string;
  perguntaId: string;
  name: string;
  unit: string;
  attemptCount: number | null;
  score: number | null;
  valorAjuda?: Record<string, any> | null;
};

/** A MABC-2 draft section with its category scores and exercises. */
export type Mabc2DraftSection = {
  id: string;
  title: string;
  categoryScore: number | null;
  categoryPercentile: string | null;
  exercises: Mabc2DraftExercise[];
};

/** The full editable draft of a MABC-2 record. */
export type Mabc2Draft = {
  formularioId: string;
  totalScore: number | null;
  totalPercentile: string | null;
  metadados: Record<string, any>;
  sections: Mabc2DraftSection[];
};

type SectionId = "destreza_manual" | "pontaria" | "equilibrio";

const SECTION_ORDER: SectionId[] = ["destreza_manual", "pontaria", "equilibrio"];

const SECTION_LABELS: Record<SectionId, string> = {
  destreza_manual: "Destreza manual",
  pontaria: "Pontaria e agarrar",
  equilibrio: "Equilíbrio",
};

const SECTION_ALIASES: Record<SectionId, string[]> = {
  destreza_manual: ["destreza", "destreza_manual"],
  pontaria: ["pontaria", "mirar_pegar", "pegar_lancar", "agarrar"],
  equilibrio: ["equilibrio", "equilíbrio"],
};

/**
 * A seeded MABC-2 draft used to *view* a record during the analysis tutorial,
 * so opening a mock record shows sample data instead of hitting the database.
 * Exercise names/units are the canonical values, localized for display by the
 * form screen.
 */
export function buildMockMabc2Draft(): Mabc2Draft {
  return {
    formularioId: "mock-mabc2-1",
    totalScore: 62,
    totalPercentile: "50",
    metadados: {},
    sections: [
      {
        id: "destreza_manual",
        title: SECTION_LABELS.destreza_manual,
        categoryScore: 22,
        categoryPercentile: "50",
        exercises: [
          { id: "mm-dm1", perguntaId: "mm-dm1", name: "DM 1 Colocar os Pinos no Tabuleiro (Mão Preferida)", unit: "seg", attemptCount: 24, score: 10, valorAjuda: null },
          { id: "mm-dm2", perguntaId: "mm-dm2", name: "DM 2 Entrelaçar o Cordão", unit: "seg", attemptCount: 30, score: 9, valorAjuda: null },
        ],
      },
      {
        id: "pontaria",
        title: SECTION_LABELS.pontaria,
        categoryScore: 20,
        categoryPercentile: "50",
        exercises: [
          { id: "mm-mp1", perguntaId: "mm-mp1", name: "MP 1 Pegar com as Duas Mãos", unit: "tentativas", attemptCount: 8, score: 11, valorAjuda: null },
        ],
      },
      {
        id: "equilibrio",
        title: SECTION_LABELS.equilibrio,
        categoryScore: 20,
        categoryPercentile: "50",
        exercises: [
          { id: "mm-e1", perguntaId: "mm-e1", name: "E 1 Equilíbrio sobre uma Prancha (Melhor Perna)", unit: "seg", attemptCount: 30, score: 12, valorAjuda: null },
        ],
      },
    ],
  };
}

function parseNumber(value: any): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value: string | null, locale: Locale, notSet: string) {
  return value
    ? new Date(value).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")
    : notSet;
}

function normalizeText(value: any) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPath(source: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function getItemComponent(item: any) {
  return getPath(item, [
    "componente",
    "componente_motor",
    "opcoes.componente",
    "opcoes.componente_motor",
    "metadados.componente",
    "metadados.componente_motor",
  ]);
}

function getItemCode(item: any) {
  return getPath(item, [
    "codigo_item",
    "codigo",
    "opcoes.codigo_item",
    "opcoes.codigo",
    "metadados.codigo_item",
    "metadados.codigo",
  ]);
}

function getItemSubItem(item: any) {
  return getPath(item, [
    "sub_item",
    "subitem",
    "opcoes.sub_item",
    "opcoes.subitem",
    "metadados.sub_item",
    "metadados.subitem",
  ]);
}

function getItemUnit(item: any) {
  return String(
    getPath(item, [
      "unidade",
      "unit",
      "opcoes.unidade",
      "opcoes.unit",
      "metadados.unidade",
      "metadados.unit",
    ]) ?? ""
  );
}

function getItemQuestionId(item: any) {
  return String(getPath(item, ["pergunta_id", "id"]) ?? "");
}

function getItemOrder(item: any) {
  return parseNumber(getPath(item, ["ordem", "opcoes.ordem", "metadados.ordem"])) ?? 0;
}

function getItemScore(item: any) {
  return parseNumber(
    getPath(item, ["escore_bruto", "valor_preenchido", "pontuacao", "score"])
  );
}

function getItemValorAjuda(item: any) {
  return getPath(item, ["valor_ajuda", "ajuda"]) as Record<string, any> | null;
}

function getItemName(item: any) {
  const label =
    getPath(item, [
      "texto_pergunta",
      "texto",
      "titulo",
      "label",
      "opcoes.label",
      "metadados.label",
    ]) ?? "";

  if (label) return String(label);

  const code = getItemCode(item);
  const subItem = getItemSubItem(item);

  return [code, subItem].filter(Boolean).join(" - ") || "Item MABC-2";
}

function identifySectionId(value: any): SectionId | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  for (const sectionId of SECTION_ORDER) {
    if (SECTION_ALIASES[sectionId].some((alias) => normalized.includes(normalizeText(alias)))) {
      return sectionId;
    }
  }

  return null;
}

function sectionMetricSource(metadados: any, sectionId: SectionId) {
  const legacyId = sectionId === "pontaria" ? "mirar_pegar" : sectionId;

  return (
    metadados?.[sectionId] ??
    metadados?.[legacyId] ??
    metadados?.componentes?.[sectionId] ??
    metadados?.componentes?.[legacyId] ??
    {}
  );
}

function createEmptySections(metadados: any): Mabc2DraftSection[] {
  return SECTION_ORDER.map((sectionId) => {
    const source = sectionMetricSource(metadados, sectionId);

    return {
      id: sectionId,
      title: SECTION_LABELS[sectionId],
      categoryScore: parseNumber(source?.pontuacao ?? source?.escore_padrao),
      categoryPercentile:
        source?.percentil !== undefined && source?.percentil !== null
          ? String(source.percentil)
          : null,
      exercises: [],
    };
  });
}

function createExercise(item: any): Mabc2DraftExercise | null {
  const perguntaId = getItemQuestionId(item);
  if (!perguntaId) return null;

  return {
    id: perguntaId,
    perguntaId,
    name: getItemName(item),
    unit: getItemUnit(item),
    attemptCount: null,
    score: getItemScore(item),
    valorAjuda: getItemValorAjuda(item),
  };
}

function sortItems(items: any[]) {
  return [...items].sort((first, second) => getItemOrder(first) - getItemOrder(second));
}

function flattenGroupedContent(conteudo: any) {
  if (Array.isArray(conteudo)) return conteudo;
  if (!conteudo || typeof conteudo !== "object") return [];

  return Object.values(conteudo).flatMap((value) => (Array.isArray(value) ? value : []));
}

function addFlatItemsToSections(sections: Mabc2DraftSection[], items: any[]) {
  const sectionById = new Map(sections.map((section) => [section.id, section]));

  for (const item of sortItems(items)) {
    const sectionId = identifySectionId(getItemComponent(item));
    if (!sectionId) continue;

    const exercise = createExercise(item);
    if (!exercise) continue;

    sectionById.get(sectionId)?.exercises.push(exercise);
  }
}

function addGroupedItemsToSections(sections: Mabc2DraftSection[], conteudo: any) {
  if (!conteudo || Array.isArray(conteudo) || typeof conteudo !== "object") {
    addFlatItemsToSections(sections, flattenGroupedContent(conteudo));
    return;
  }

  const sectionById = new Map(sections.map((section) => [section.id, section]));

  for (const [groupName, items] of Object.entries(conteudo)) {
    if (!Array.isArray(items)) continue;

    const sectionId = identifySectionId(groupName);
    if (!sectionId) {
      addFlatItemsToSections(sections, items);
      continue;
    }

    for (const item of sortItems(items)) {
      const exercise = createExercise(item);
      if (!exercise) continue;
      sectionById.get(sectionId)?.exercises.push(exercise);
    }
  }
}

function mapItemsToDraft(
  formularioId: string,
  metadados: any,
  itens: any[]
): Mabc2Draft {
  const sections = createEmptySections(metadados);
  addFlatItemsToSections(sections, itens);

  return {
    formularioId,
    totalScore: parseNumber(metadados?.pontuacao_total ?? metadados?.escore_total),
    totalPercentile:
      metadados?.percentil_total !== undefined && metadados?.percentil_total !== null
        ? String(metadados.percentil_total)
        : metadados?.percentil !== undefined && metadados?.percentil !== null
          ? String(metadados.percentil)
          : null,
    metadados: metadados ?? {},
    sections,
  };
}

function mapExportToDraft(data: any): Mabc2Draft {
  const metadados = data?.metadados ?? {};
  const sections = createEmptySections(metadados);
  addGroupedItemsToSections(sections, data?.conteudo);

  return {
    formularioId: data?.id,
    totalScore: parseNumber(metadados?.pontuacao_total ?? metadados?.escore_total),
    totalPercentile:
      metadados?.percentil_total !== undefined && metadados?.percentil_total !== null
        ? String(metadados.percentil_total)
        : metadados?.percentil !== undefined && metadados?.percentil !== null
          ? String(metadados.percentil)
          : null,
    metadados,
    sections,
  };
}

function buildTotalsPayload(draft: Mabc2Draft) {
  const sectionTotals = Object.fromEntries(
    draft.sections.map((section) => [
      section.id,
      {
        pontuacao: section.categoryScore,
        percentil: section.categoryPercentile,
      },
    ])
  );

  return {
    pontuacao_total: draft.totalScore,
    percentil_total: draft.totalPercentile,
    destreza_manual: sectionTotals.destreza_manual ?? {
      pontuacao: null,
      percentil: null,
    },
    pontaria: sectionTotals.pontaria ?? {
      pontuacao: null,
      percentil: null,
    },
    equilibrio: sectionTotals.equilibrio ?? {
      pontuacao: null,
      percentil: null,
    },
  };
}

/** Seed MABC-2 list records for the tutorial's mock analysis. */
function buildMockMabc2Records(formLabel: (n: number) => string): Mabc2Record[] {
  return [
    { id: "mock-mabc-1", label: formLabel(1), date: "26/06/2026", totalScore: 62, totalPercentile: "50" },
    { id: "mock-mabc-2", label: formLabel(2), date: "12/05/2026", totalScore: 48, totalPercentile: "25" },
  ];
}

/**
 * Loads a student's MABC-2 records as list summaries, with a refetch action.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) for seeded records.
 */
export function useMabc2Records(studentId: string, options?: { mock?: boolean }) {
  const isMock = options?.mock ?? false;
  const { t, locale } = useI18n();
  const formLabel = useCallback(
    (n: number) => t("analysis.protocolViz.formLabel").replace("{x}", `MABC-2 ${n}`),
    [t],
  );
  const [records, setRecords] = useState<Mabc2Record[]>(isMock ? buildMockMabc2Records(formLabel) : []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (isMock) {
      setRecords(buildMockMabc2Records(formLabel));
      setIsLoading(false);
      return;
    }
    if (!studentId) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("rpc_get_historico_mabc2_aluno", {
        p_aluno_id: studentId,
      });

      if (rpcError) throw rpcError;

      const list = Array.isArray(data) ? data : [];

      setRecords(
        list.map((item: any, index: number) => ({
          id: item.id,
          label: formLabel(index + 1),
          date: formatDate(item.created_at, locale, t("common.dateNotSet")),
          totalScore: parseNumber(
            item.metadados?.pontuacao_total ?? item.metadados?.escore_total
          ),
          totalPercentile:
            item.metadados?.percentil_total !== undefined &&
            item.metadados?.percentil_total !== null
              ? String(item.metadados.percentil_total)
              : item.metadados?.percentil !== undefined && item.metadados?.percentil !== null
                ? String(item.metadados.percentil)
                : null,
        }))
      );
    } catch (err: any) {
      setRecords([]);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, isMock, formLabel, locale, t]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { records, isLoading, refetch, error };
}

/** Creates a new MABC-2 record for a student and returns it as an empty draft. */
export async function startMabc2Record(
  studentId: string,
  t: (key: TranslationKey) => string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error(t("common.err.notAuthenticated"));

  const { data, error } = await supabase.rpc("rpc_iniciar_mabc2", {
    p_aluno_id: studentId,
    p_avaliador_id: user.id,
  });

  if (error) throw error;

  return mapItemsToDraft(data.formulario_id, {}, data.itens ?? []);
}

/** Loads a MABC-2 record via the per-form RPC when the export RPC has no items. */
async function getMabc2RecordFallback(formularioId: string) {
  const { data: fallbackData, error: fallbackError } = await supabase.rpc(
    "rpc_get_mabc2_formulario",
    {
      p_formulario_id: formularioId,
    }
  );

  if (fallbackError) throw fallbackError;

  return mapItemsToDraft(
    fallbackData.formulario.id,
    fallbackData.formulario.metadados ?? {},
    fallbackData.itens ?? []
  );
}

/** Loads a MABC-2 record as an editable draft, falling back when needed. */
export async function getMabc2Record(formularioId: string) {
  const { data, error } = await supabase.rpc("rpc_get_registro_exportacao", {
    p_tipo: "formulario",
    p_id: formularioId,
  });

  if (!error) {
    const draft = mapExportToDraft(data);

    if (draft.formularioId && draft.sections.some((section) => section.exercises.length > 0)) {
      return draft;
    }
  }

  return getMabc2RecordFallback(formularioId);
}

/** Persists each item's score and the section/total scores of a MABC-2 draft. */
export async function saveMabc2Record(draft: Mabc2Draft) {
  for (const section of draft.sections) {
    for (const exercise of section.exercises) {
      const hasScore = exercise.score !== null;

      const { error } = await supabase.rpc("rpc_responder_item_mabc2", {
        p_formulario_id: draft.formularioId,
        p_pergunta_id: exercise.perguntaId,
        p_escore_bruto: hasScore ? exercise.score : null,
        p_nivel_ajuda: hasScore ? "autonomo" : null,
        p_complementos: hasScore ? ["sem_ajuda"] : null,
        p_status: hasScore ? "respondido" : "adiado",
      });

      if (error) throw error;
    }
  }

  const { error } = await supabase.rpc("rpc_salvar_totais_mabc2", {
    p_formulario_id: draft.formularioId,
    p_totais_jsonb: buildTotalsPayload(draft),
  });

  if (error) throw error;
}

/** Permanently deletes a MABC-2 record and its answers. */
export async function deleteMabc2Record(formularioId: string) {
  const { error: answersError } = await supabase
    .from("respostas_formulario")
    .delete()
    .eq("formulario_id", formularioId);

  if (answersError) throw answersError;

  const { error: formError } = await supabase
    .from("formularios")
    .delete()
    .eq("id", formularioId)
    .eq("tipo", "mabc2")
    .eq("protegido", false);

  if (formError) throw formError;
}
