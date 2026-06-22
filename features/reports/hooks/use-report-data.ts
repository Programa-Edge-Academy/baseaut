import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export type ReportData = {
  progresso: any[] | null;
  ajuda: any[] | null;
  comportamentos: any[] | null;
  comparacao: any | null;
  consolidado: any | null;
};

function toIso(date: string) {
  return `${date}T00:00:00.000-03:00`;
}

function midDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(Math.floor((s + e) / 2)).toISOString().split("T")[0];
}

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
                p_data_inicio: toIso(dataInicio),
                p_data_fim: toIso(dataFim),
              })
              .then((r) => {
                const d = r.data as any;
                return d?.sessoes ?? [];
              }),

            fetchBehaviors(studentId, dataInicio, dataFim),

            supabase
              .rpc("rpc_comparar_desempenho_periodos", {
                p_aluno_id: studentId,
                p_p1_inicio: toIso(dataInicio),
                p_p1_fim: toIso(meio),
                p_p2_inicio: toIso(meio),
                p_p2_fim: toIso(dataFim),
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
      } catch (err) {
        console.error("Erro ao carregar dados do relatório:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchAll();
    return () => { active = false; };
  }, [studentId, dataInicio, dataFim]);

  return { data, isLoading };
}

const BEHAVIOR_MAP: Record<string, string> = {
  estereotipia: "stereotypy",
  contato_visual: "eye_contact",
  engajamento: "engagement",
  fuga: "escape",
  crise: "crisis",
};

async function fetchBehaviors(studentId: string, inicio: string, fim: string) {
  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id, data_inicio")
    .eq("aluno_id", studentId)
    .gte("data_inicio", inicio)
    .lte("data_inicio", fim);

  const ids = (sessoes ?? []).map((s: any) => s.id);
  if (!ids.length) return [];

  const sessionDateMap: Record<string, string> = {};
  (sessoes ?? []).forEach((s: any) => {
    sessionDateMap[s.id] = s.data_inicio?.split("T")[0] ?? inicio;
  });

  const { data } = await supabase
    .from("comportamentos_sessao")
    .select("tipo, sessao_id")
    .in("sessao_id", ids)
    .neq("tipo", "outro");

  const grouped: Record<string, Record<string, number>> = {};
  (data ?? []).forEach((b: any) => {
    const frontendType = BEHAVIOR_MAP[b.tipo];
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
