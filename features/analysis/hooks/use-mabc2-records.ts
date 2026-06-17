import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import type { Mabc2Record } from "../components/mabc2-record-card";

export type Mabc2DraftExercise = {
  id: string;
  perguntaId: string;
  name: string;
  unit: string;
  attemptCount: number | null;
  score: number | null;
};

export type Mabc2DraftSection = {
  id: string;
  title: string;
  categoryScore: number | null;
  categoryPercentile: string | null;
  exercises: Mabc2DraftExercise[];
};

export type Mabc2Draft = {
  formularioId: string;
  totalScore: number | null;
  totalPercentile: string | null;
  metadados: Record<string, any>;
  sections: Mabc2DraftSection[];
};

type ExerciseRule = {
  key: string;
  component: string;
  code: string;
  subItem?: string;
  label: string;
};

const SECTION_ORDER = ["destreza_manual", "mirar_pegar", "equilibrio"];

const SECTION_LABELS: Record<string, string> = {
  destreza_manual: "Destreza manual",
  mirar_pegar: "Pontaria e agarrar",
  equilibrio: "Equilíbrio",
};

const EXERCISE_RULES: ExerciseRule[] = [
  {
    key: "dm1_mao_preferida",
    component: "destreza_manual",
    code: "DM1",
    subItem: "mao_preferida",
    label: "Inserir moeda com a mão preferida",
  },
  {
    key: "dm1_mao_nao_preferida",
    component: "destreza_manual",
    code: "DM1",
    subItem: "mao_nao_preferida",
    label: "Inserir moeda com a mão não preferida",
  },
  {
    key: "dm2",
    component: "destreza_manual",
    code: "DM2",
    label: "Enfiar contas num cordão",
  },
  {
    key: "dm3",
    component: "destreza_manual",
    code: "DM3",
    label: "Desenhar trilha",
  },
  {
    key: "mp1",
    component: "mirar_pegar",
    code: "MP1",
    label: "Agarrar saco de grãos",
  },
  {
    key: "mp2",
    component: "mirar_pegar",
    code: "MP2",
    label: "Lançar saco de grãos no tapete",
  },
  {
    key: "e1_melhor_perna",
    component: "equilibrio",
    code: "E1",
    subItem: "melhor_perna",
    label: "Equilíbrio na melhor perna",
  },
  {
    key: "e1_outra_perna",
    component: "equilibrio",
    code: "E1",
    subItem: "outra_perna",
    label: "Equilíbrio na outra perna",
  },
  {
    key: "e2",
    component: "equilibrio",
    code: "E2",
    label: "Caminhar com calcanhares elevados",
  },
];

function parseNumber(value: any): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("pt-BR")
    : "Data não definida";
}

function getItemComponent(item: any) {
  return item.componente ?? item.opcoes?.componente ?? "";
}

function getItemCode(item: any) {
  return item.codigo_item ?? item.opcoes?.codigo_item ?? "";
}

function getItemSubItem(item: any) {
  return item.sub_item ?? item.opcoes?.sub_item ?? "";
}

function getItemUnit(item: any) {
  return item.unidade ?? item.opcoes?.unidade ?? "";
}

function getItemQuestionId(item: any) {
  return item.pergunta_id ?? item.id ?? "";
}

function matchesRule(item: any, rule: ExerciseRule) {
  const component = getItemComponent(item);
  const code = getItemCode(item);
  const subItem = getItemSubItem(item);

  if (component !== rule.component) return false;
  if (code !== rule.code) return false;

  if (rule.subItem) {
    return subItem === rule.subItem;
  }

  return true;
}

function createEmptySections(metadados: any): Mabc2DraftSection[] {
  return SECTION_ORDER.map((sectionId) => ({
    id: sectionId,
    title: SECTION_LABELS[sectionId],
    categoryScore: metadados?.componentes?.[sectionId]?.escore_padrao ?? null,
    categoryPercentile: metadados?.componentes?.[sectionId]?.percentil ?? null,
    exercises: [],
  }));
}

function mapItemsToDraft(
  formularioId: string,
  metadados: any,
  itens: any[]
): Mabc2Draft {
  const sections = createEmptySections(metadados);
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const usedRules = new Set<string>();

  for (const rule of EXERCISE_RULES) {
    if (usedRules.has(rule.key)) continue;

    const item = itens.find((currentItem) => matchesRule(currentItem, rule));
    if (!item) continue;

    const perguntaId = getItemQuestionId(item);
    if (!perguntaId) continue;

    const section = sectionById.get(rule.component);
    if (!section) continue;

    section.exercises.push({
      id: perguntaId,
      perguntaId,
      name: rule.label,
      unit: getItemUnit(item),
      attemptCount: null,
      score: parseNumber(item.escore_bruto),
    });

    usedRules.add(rule.key);
  }

  return {
    formularioId,
    totalScore: metadados?.escore_total ?? null,
    totalPercentile: metadados?.percentil ?? null,
    metadados: metadados ?? {},
    sections,
  };
}

export function useMabc2Records(studentId: string) {
  const [records, setRecords] = useState<Mabc2Record[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!studentId) {
      setRecords([]);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("rpc_get_historico_mabc2_aluno", {
        p_aluno_id: studentId,
      });

      if (error) throw error;

      const list = Array.isArray(data) ? data : [];

      setRecords(
        list.map((item: any, index: number) => ({
          id: item.id,
          label: `Formulário MABC-2 ${index + 1}`,
          date: formatDate(item.created_at),
          totalScore: item.metadados?.escore_total ?? null,
          totalPercentile: item.metadados?.percentil ?? null,
        }))
      );
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { records, isLoading, refetch };
}

export async function startMabc2Record(studentId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase.rpc("rpc_iniciar_mabc2", {
    p_aluno_id: studentId,
    p_avaliador_id: user.id,
  });

  if (error) throw error;

  return mapItemsToDraft(data.formulario_id, {}, data.itens ?? []);
}

export async function getMabc2Record(formularioId: string) {
  const { data, error } = await supabase.rpc("rpc_get_mabc2_formulario", {
    p_formulario_id: formularioId,
  });

  if (error) throw error;

  return mapItemsToDraft(
    data.formulario.id,
    data.formulario.metadados ?? {},
    data.itens ?? []
  );
}

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

  const componentes = Object.fromEntries(
    draft.sections.map((section) => [
      section.id,
      {
        escore_padrao: section.categoryScore,
        percentil: section.categoryPercentile,
      },
    ])
  );

  const { error } = await supabase.rpc("rpc_salvar_totais_mabc2", {
    p_formulario_id: draft.formularioId,
    p_totais_jsonb: {
      escore_total: draft.totalScore,
      percentil: draft.totalPercentile,
      componentes,
    },
  });

  if (error) throw error;
}

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