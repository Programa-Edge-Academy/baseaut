import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import {
  localizeFormText,
  localizeMabcComponent,
  localizeMabcUnit,
} from "@/features/forms/utils/form-content-i18n";
import type { ProtocolTipo } from "./use-protocol-records";

/** A scored section of an ATA record. */
export type AtaSection = {
  id: string;
  title: string;
  value: number | null;
  valueLabel: string;
};

/** Full ATA record detail: its sections and total score. */
export type AtaDetail = {
  sections: AtaSection[];
  total: number | null;
};

/** A scored domain of a CARS record, with an optional observation. */
export type CarsDomain = {
  id: string;
  title: string;
  score: number | null;
  scoreLabel: string;
  observation: string | null;
};

/** Full CARS record detail: its domains and total score. */
export type CarsDetail = {
  domains: CarsDomain[];
  total: number | null;
};

/** A single scored item within a MABC-2 component. */
export type Mabc2Item = {
  id: string;
  name: string;
  unit: string;
  rawScore: string;
};

/** A MABC-2 component (e.g. manual dexterity) with its items and category scores. */
export type Mabc2Component = {
  title: string;
  categoryScore: number | null;
  categoryPercentile: string | null;
  items: Mabc2Item[];
};

/** Full MABC-2 record detail, including evaluator, scores, and components. */
export type Mabc2Detail = {
  titulo: string;
  ageGroupLabel: string | null;
  evaluatorName: string | null;
  dateLabel: string;
  totalScore: number | null;
  standardScore: number | null;
  totalPercentile: string | null;
  components: Mabc2Component[];
};

/** Detail of a protocol record, populated for exactly one protocol type. */
export type ProtocolRecordDetail = {
  ata?: AtaDetail;
  cars?: CarsDetail;
  mabc2?: Mabc2Detail;
};

/** Parses a value into a finite number (accepting commas), or null. */
function parseNumber(value: any): number | null {
  if (value == null || value === "") return null;
  const parsed = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Keeps the human-readable title (first line) of a question's text. */
function questionTitle(text: string): string {
  return String(text ?? "").split("\n")[0].trim();
}

/**
 * Loads the read-only detail of a single protocol record so the visualization
 * screens can render it: ATA sections, CARS domains, or the MABC-2 structure.
 */
export function useProtocolRecordDetail(tipo?: ProtocolTipo, recordId?: string) {
  const { t, locale } = useI18n();
  const [detail, setDetail] = useState<ProtocolRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(tipo && recordId));
  const [error, setError] = useState<Error | null>(null);

  const fetchAtaCars = useCallback(
    async (formularioId: string): Promise<{ perguntas: any[]; answers: Map<string, string | null> }> => {
      const { data: perguntas, error: perguntasError } = await supabase
        .from("perguntas")
        .select("id, texto_pergunta, tipo_resposta, ordem")
        .eq("formulario_id", formularioId)
        .order("ordem", { ascending: true });
      if (perguntasError) throw perguntasError;

      const { data: respostas, error: respostasError } = await supabase
        .from("respostas_formulario")
        .select("pergunta_id, valor_preenchido")
        .eq("formulario_id", formularioId);
      if (respostasError) throw respostasError;

      const answers = new Map<string, string | null>();
      (respostas ?? []).forEach((r: any) =>
        answers.set(r.pergunta_id, r.valor_preenchido),
      );

      return { perguntas: perguntas ?? [], answers };
    },
    [],
  );

  const fetchDetail = useCallback(async () => {
    if (!tipo || !recordId) return;

    setIsLoading(true);
    setError(null);

    // Tutorial mock: seeded record ids never hit the database. Provide sample
    // totals so the ATA/CARS visualization renders (its form uses mock mode).
    if (recordId.startsWith("mock")) {
      if (tipo === "ata") setDetail({ ata: { sections: [], total: 18 } });
      else if (tipo === "cars") setDetail({ cars: { domains: [], total: 22 } });
      else setDetail(null);
      setIsLoading(false);
      return;
    }

    try {
      if (tipo === "ata") {
        const { perguntas, answers } = await fetchAtaCars(recordId);
        let total = 0;
        let hasAny = false;
        const sections: AtaSection[] = perguntas.map((q: any) => {
          const value = parseNumber(answers.get(q.id));
          if (value != null) {
            total += value;
            hasAny = true;
          }
          return {
            id: q.id,
            title: questionTitle(localizeFormText(q.texto_pergunta, locale)),
            value,
            valueLabel: value != null ? String(value) : "—",
          };
        });
        setDetail({ ata: { sections, total: hasAny ? total : null } });
      } else if (tipo === "cars") {
        const { perguntas, answers } = await fetchAtaCars(recordId);
        const domains: CarsDomain[] = [];
        let total = 0;
        let hasAny = false;

        for (const q of perguntas) {
          if (q.tipo_resposta === "texto_opcional") {
            const observation = answers.get(q.id);
            if (domains.length > 0) {
              domains[domains.length - 1].observation =
                observation && observation !== "" ? observation : null;
            }
            continue;
          }
          const score = parseNumber(answers.get(q.id));
          if (score != null) {
            total += score;
            hasAny = true;
          }
          domains.push({
            id: q.id,
            title: questionTitle(localizeFormText(q.texto_pergunta, locale)),
            score,
            scoreLabel: score != null ? String(score).replace(".", ",") : "—",
            observation: null,
          });
        }
        setDetail({ cars: { domains, total: hasAny ? total : null } });
      } else {
        const { data, error: rpcError } = await supabase.rpc(
          "rpc_get_mabc2_formulario",
          { p_formulario_id: recordId },
        );
        if (rpcError) throw rpcError;

        const payload = (data ?? {}) as any;
        const meta = payload.formulario?.metadados ?? {};
        const itens = (payload.itens ?? []) as any[];

        const componentMap = new Map<string, Mabc2Component>();
        for (const item of itens) {
          const key = item.componente ?? "Outros";
          if (!componentMap.has(key)) {
            componentMap.set(key, {
              title: localizeMabcComponent(key, locale),
              categoryScore: meta?.componentes?.[key]?.escore_padrao ?? null,
              categoryPercentile: meta?.componentes?.[key]?.percentil ?? null,
              items: [],
            });
          }
          // Keep the raw unit code so the exercise row's `formatMeasuredUnit`
          // (localized in the component) still matches; localize only the unit
          // suffix shown alongside the raw score.
          const unit = item.unidade ?? "";
          const rawScore =
            item.escore_bruto != null
              ? `${item.escore_bruto} ${localizeMabcUnit(unit, locale)}`.trim()
              : "—";
          const localizedItemTitle = questionTitle(localizeFormText(item.texto, locale));
          componentMap.get(key)!.items.push({
            id: item.pergunta_id,
            name: item.codigo_item
              ? `${item.codigo_item} — ${localizedItemTitle}`
              : localizedItemTitle,
            unit,
            rawScore,
          });
        }

        setDetail({
          mabc2: {
            titulo: localizeFormText(payload.formulario?.titulo ?? "MABC-2", locale),
            ageGroupLabel: meta.faixa_mabc ?? meta.grupo_idade ?? null,
            evaluatorName: payload.avaliador?.nome_completo ?? null,
            dateLabel: payload.formulario?.created_at
              ? new Date(payload.formulario.created_at).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")
              : t("common.dateNotSet"),
            totalScore: meta.escore_total ?? null,
            standardScore: meta.escore_padrao ?? null,
            totalPercentile: meta.percentil ?? null,
            components: Array.from(componentMap.values()),
          },
        });
      }
    } catch (caught: any) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [tipo, recordId, fetchAtaCars, t, locale]);

  useEffect(() => {
    if (tipo && recordId) fetchDetail();
  }, [tipo, recordId, fetchDetail]);

  return { detail, isLoading, error, refetch: fetchDetail };
}
