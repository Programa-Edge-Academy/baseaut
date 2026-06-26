import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

/** Aggregated data sets that compose a student's report. */
export type ReportData = {
  progresso: any[] | null;
  ajuda: any[] | null;
  comportamentos: any[] | null;
  comparacao: any | null;
  consolidado: any | null;
};

/** Converts a `YYYY-MM-DD` date into an ISO string at start of day (UTC-3). */
function toIsoStart(date: string) {
  return `${date}T00:00:00.000-03:00`;
}

/** Converts a `YYYY-MM-DD` date into an ISO string at end of day (UTC-3). */
function toIsoEnd(date: string) {
  return `${date}T23:59:59.999-03:00`;
}

/** Returns the midpoint date between two dates, used to split comparison periods. */
function midDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(Math.floor((s + e) / 2)).toISOString().split("T")[0];
}

/** Returns the very next day (YYYY-MM-DD) to prevent period overlap. */
function nextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Loads and aggregates the data needed for a student's report over a date range:
 * exercise progress, autonomy/help, observed behaviors, period comparison, and
 * the consolidated record (filtered to the range).
 *
 * @remarks
 * The range is inclusive of both ends: start dates use {@link toIsoStart}
 * (00:00) and end dates use {@link toIsoEnd} (23:59), so records on `dataFim`
 * are counted. For the period comparison, the second period starts on the day
 * after the midpoint ({@link nextDay}) so the two halves never overlap.
 *
 * @param studentId - Student whose data is aggregated.
 * @param dataInicio - Inclusive start date (`YYYY-MM-DD`).
 * @param dataFim - Inclusive end date (`YYYY-MM-DD`).
 */
export function useReportData(studentId: string, dataInicio: string, dataFim: string) {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !dataInicio || !dataFim) return;
    let active = true;

    async function fetchAll() {
      setIsLoading(true);
      try {
        const meio = midDate(dataInicio, dataFim);
        const inicioPeriodo2 = nextDay(meio);

        const [progresso, ajuda, comportamentos, comparacao, consolidado] =
          await Promise.all([
            supabase
              .rpc("rpc_get_progresso_exercicios", {
                p_aluno_id: studentId,
                p_data_inicio: dataInicio,
                p_data_fim: dataFim,
              })
              .then((r) => r.data ?? []),

            supabase
              .rpc("rpc_get_grafico_autonomia_aluno", {
                p_aluno_id: studentId,
                p_data_inicio: toIsoStart(dataInicio),
                p_data_fim: toIsoEnd(dataFim),
              })
              .then((r) => {
                const d = r.data as any;
                return d?.sessoes ?? [];
              }),

            fetchBehaviors(studentId, dataInicio, dataFim),

            supabase
              .rpc("rpc_comparar_desempenho_periodos", {
                p_aluno_id: studentId,
                p_p1_inicio: toIsoStart(dataInicio),
                p_p1_fim: toIsoEnd(meio),
                p_p2_inicio: toIsoStart(inicioPeriodo2),
                p_p2_fim: toIsoEnd(dataFim),
              })
              .then((r) => {
                const d = r.data;
                return typeof d === "string" ? JSON.parse(d) : d;
              }),

            supabase
              .rpc("rpc_get_relatorio_consolidado_aluno", { p_aluno_id: studentId })
              .then((r) => {
                const d = r.data;
                return typeof d === "string" ? JSON.parse(d) : d;
              }),
          ]);

        if (!active) return;

        const inicioMs = new Date(dataInicio).getTime();
        const fimMs = new Date(dataFim).getTime() + 86400000;
        const filterByDate = (list: any[], dateField = "data") =>
          (list ?? []).filter((item: any) => {
            const d = new Date(item[dateField] ?? item.data_sessao).getTime();
            return d >= inicioMs && d <= fimMs;
          });

        setData({
          progresso: progresso as any[],
          ajuda: ajuda as any[],
          comportamentos: comportamentos as any[],
          comparacao,
          consolidado: consolidado
            ? {
                ...consolidado,
                historico_cars: filterByDate(consolidado.historico_cars ?? []),
                historico_ata: filterByDate(consolidado.historico_ata ?? []),
                historico_mabc2: filterByDate(consolidado.historico_mabc2 ?? []),
                registros_controle: filterByDate(consolidado.registros_controle ?? [], "data_sessao"),
              }
            : null,
        });
      } catch {
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchAll();
    return () => { active = false; };
  }, [studentId, dataInicio, dataFim]);

  return { data, isLoading };
}

/** Maps database behavior types to the chart's frontend behavior keys. */
const BEHAVIOR_MAP: Record<string, string> = {
  estereotipia: "stereotypy",
  engajamento: "engagement",
  fuga: "escape",
  crise: "crisis",
  inapto: "unfit",
  atividade_preferencial: "preferred_activity",
};

/** Resolves the chart behavior type, splitting eye contact into people/objects. */
function resolveBehaviorType(tipo: string, observacao: string | null): string | undefined {
  if (tipo === "contato_visual") {
    const obs = (observacao ?? "").toLowerCase();
    if (obs.includes("objeto")) return "eye_contact_objects";
    if (obs.includes("pessoa")) return "eye_contact_people";
    return undefined;
  }
  return BEHAVIOR_MAP[tipo];
}

/** Loads observed behaviors for completed sessions in range, grouped by type and date. */
async function fetchBehaviors(studentId: string, inicio: string, fim: string) {
  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id, data_inicio")
    .eq("aluno_id", studentId)
    .eq("status", "concluida")
    .gte("data_inicio", toIsoStart(inicio))
    .lte("data_inicio", toIsoEnd(fim));

  const ids = (sessoes ?? []).map((s: any) => s.id);
  if (!ids.length) return [];

  const sessionDateMap: Record<string, string> = {};
  (sessoes ?? []).forEach((s: any) => {
    sessionDateMap[s.id] = s.data_inicio?.split("T")[0] ?? inicio;
  });

  const { data } = await supabase
    .from("comportamentos_sessao")
    .select("tipo, sessao_id, observacao")
    .in("sessao_id", ids)
    .neq("tipo", "outro");

  const grouped: Record<string, Record<string, number>> = {};
  (data ?? []).forEach((b: any) => {
    const frontendType = resolveBehaviorType(b.tipo, b.observacao);
    if (!frontendType) return;
    const date = sessionDateMap[b.sessao_id] ?? inicio;
    const key = `${frontendType}__${date}`;
    if (!grouped[key]) grouped[key] = { count: 0 };
    grouped[key].count++;
  });

  return Object.entries(grouped).map(([key, val]) => {
    const [behaviorType, date] = key.split("__");
    return {
      id: key,
      behaviorType: behaviorType as any,
      date,
      frequency: val.count,
    };
  });
}
