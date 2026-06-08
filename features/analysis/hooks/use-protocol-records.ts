import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/** Supported protocol types for the US10.6 visualization. */
export type ProtocolTipo = "ata" | "cars" | "mabc2";

export type ProtocolStatus = "registrado" | "nao_registrado";

/** A single saved protocol record (one `formularios` instance for a student). */
export type ProtocolRecord = {
  id: string;
  label: string;
  dateLabel: string;
  rawDate: string | null;
  score: number | null;
  scoreLabel: string | null;
  evaluatorName: string | null;
  ageGroupLabel: string | null;
  percentile: string | null;
};

const PROTOCOL_LABELS: Record<ProtocolTipo, string> = {
  ata: "ATA",
  cars: "CARS",
  mabc2: "MABC-2",
};

function formatDate(value: string | null): string {
  if (!value) return "Data não definida";
  return new Date(value).toLocaleDateString("pt-BR");
}

/** Sums every numeric answer of a form, ignoring text answers (e.g. notes). */
function sumNumericAnswers(values: (string | null)[]): number | null {
  let total = 0;
  let counted = 0;
  for (const value of values) {
    if (value == null) continue;
    const parsed = parseFloat(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) {
      total += parsed;
      counted += 1;
    }
  }
  return counted > 0 ? total : null;
}

/**
 * Loads the saved records of a protocol (ATA/CARS via direct queries with a
 * front-computed total score; MABC-2 via the dedicated history RPC) for a
 * student, exposing only records that actually have answers.
 */
export function useProtocolRecords(studentId?: string, tipo?: ProtocolTipo) {
  const [records, setRecords] = useState<ProtocolRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(studentId && tipo));
  const [error, setError] = useState<Error | null>(null);

  const fetchAtaCars = useCallback(
    async (alunoId: string, protocolo: "ata" | "cars"): Promise<ProtocolRecord[]> => {
      const { data: forms, error: formsError } = await supabase
        .from("formularios")
        .select("id, created_at, avaliador_id")
        .eq("aluno_id", alunoId)
        .eq("tipo", protocolo)
        .eq("protegido", false)
        .order("created_at", { ascending: true });
      if (formsError) throw formsError;

      const formList = forms ?? [];
      if (formList.length === 0) return [];

      const formIds = formList.map((f: any) => f.id);

      const { data: answers, error: answersError } = await supabase
        .from("respostas_formulario")
        .select("formulario_id, valor_preenchido")
        .in("formulario_id", formIds);
      if (answersError) throw answersError;

      const evaluatorIds = Array.from(
        new Set(formList.map((f: any) => f.avaliador_id).filter(Boolean)),
      );
      const evaluatorNames = new Map<string, string>();
      if (evaluatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome_completo")
          .in("id", evaluatorIds);
        (profiles ?? []).forEach((p: any) =>
          evaluatorNames.set(p.id, p.nome_completo),
        );
      }

      const answersByForm = new Map<string, (string | null)[]>();
      (answers ?? []).forEach((a: any) => {
        const list = answersByForm.get(a.formulario_id) ?? [];
        list.push(a.valor_preenchido);
        answersByForm.set(a.formulario_id, list);
      });

      const protocolLabel = PROTOCOL_LABELS[protocolo];
      return formList
        .map((form: any, index: number): ProtocolRecord | null => {
          const formAnswers = answersByForm.get(form.id) ?? [];
          const hasAnswers = formAnswers.some((v) => v != null && v !== "");
          if (!hasAnswers) return null;

          const score = sumNumericAnswers(formAnswers);
          return {
            id: form.id,
            label: `Formulário ${protocolLabel} ${index + 1}`,
            dateLabel: formatDate(form.created_at),
            rawDate: form.created_at,
            score,
            scoreLabel: score != null ? String(score).replace(".", ",") : null,
            evaluatorName: form.avaliador_id
              ? evaluatorNames.get(form.avaliador_id) ?? null
              : null,
            ageGroupLabel: null,
            percentile: null,
          };
        })
        .filter((r): r is ProtocolRecord => r !== null);
    },
    [],
  );

  const fetchMabc2 = useCallback(
    async (alunoId: string): Promise<ProtocolRecord[]> => {
      const { data, error: rpcError } = await supabase.rpc(
        "rpc_get_historico_mabc2_aluno",
        { p_aluno_id: alunoId },
      );
      if (rpcError) throw rpcError;

      const list = (Array.isArray(data) ? data : []) as any[];
      const evaluatorIds = Array.from(
        new Set(list.map((f) => f.avaliador_id).filter(Boolean)),
      );
      const evaluatorNames = new Map<string, string>();
      if (evaluatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome_completo")
          .in("id", evaluatorIds);
        (profiles ?? []).forEach((p: any) =>
          evaluatorNames.set(p.id, p.nome_completo),
        );
      }

      return list.map((form, index): ProtocolRecord => {
        const meta = form.metadados ?? {};
        const score = meta.escore_total ?? meta.escore_total_teste ?? null;
        return {
          id: form.id,
          label: `Formulário MABC-2 ${index + 1}`,
          dateLabel: formatDate(form.created_at),
          rawDate: form.created_at,
          score: typeof score === "number" ? score : null,
          scoreLabel: score != null ? String(score) : null,
          evaluatorName: form.avaliador_id
            ? evaluatorNames.get(form.avaliador_id) ?? null
            : null,
          ageGroupLabel: meta.faixa_mabc ?? meta.grupo_idade ?? null,
          percentile: meta.percentil ?? null,
        };
      });
    },
    [],
  );

  const fetchRecords = useCallback(async () => {
    if (!studentId || !tipo) return;

    setIsLoading(true);
    setError(null);
    try {
      const result =
        tipo === "mabc2"
          ? await fetchMabc2(studentId)
          : await fetchAtaCars(studentId, tipo);
      // Mais recentes primeiro na exibição.
      const sorted = [...result].sort((a, b) => {
        const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return dateB - dateA;
      });
      setRecords(sorted);
    } catch (caught: any) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [studentId, tipo, fetchAtaCars, fetchMabc2]);

  useEffect(() => {
    if (studentId && tipo) fetchRecords();
  }, [studentId, tipo, fetchRecords]);

  return { records, isLoading, error, refetch: fetchRecords };
}
