import { deliverFiles, type DeliveryMode, type ExportableFile } from "@/lib/export-delivery";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";
import { Report } from "../hooks/use-student-reports";

// ─── Student profile ─────────────────────────────────────────────────────────

type StudentProfile = {
  nome_completo: string;
  altura: number | null;
  peso: number | null;
  cintura: number | null;
  data_nascimento: string | null;
  nivel_suporte: string | null;
  observacoes_clinicas: string | null;
};

async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const { data } = await supabase
    .from("alunos")
    .select("nome_completo, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas")
    .eq("id", studentId)
    .single();
  return (data as StudentProfile) ?? null;
}

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmtSupportLevel(raw: string | null): string {
  if (!raw) return "–";
  if (raw === "nivel_1") return "Nível 1";
  if (raw === "nivel_2") return "Nível 2";
  if (raw === "nivel_3") return "Nível 3";
  return raw;
}

function buildStudentInfoHtml(profile: StudentProfile): string {
  const chip = (label: string, value: string) =>
    `<td style="padding:6px 10px;border:1px solid #e2e8f0;vertical-align:top">
       <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">${label}</div>
       <div style="font-size:12px;color:#1e293b;font-weight:bold">${value}</div>
     </td>`;
  const age = profile.data_nascimento ? `${calcAge(profile.data_nascimento)} anos` : "–";
  return `
    <div style="margin-bottom:24px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;page-break-inside:avoid">
      <p style="font-size:14px;font-weight:bold;color:#1e293b;margin:0 0 12px">Informações da criança</p>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          ${chip("Nome", profile.nome_completo)}
          ${chip("Idade", age)}
          ${chip("Nível de suporte", fmtSupportLevel(profile.nivel_suporte))}
        </tr>
        <tr>
          ${chip("Altura", profile.altura != null ? `${profile.altura} cm` : "–")}
          ${chip("Peso", profile.peso != null ? `${profile.peso} kg` : "–")}
          ${chip("Cintura", profile.cintura != null ? `${profile.cintura} cm` : "–")}
        </tr>
        ${profile.observacoes_clinicas ? `<tr><td colspan="3" style="padding:6px 10px;border:1px solid #e2e8f0">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Observações clínicas</div>
          <div style="font-size:12px;color:#1e293b">${profile.observacoes_clinicas}</div>
        </td></tr>` : ""}
      </table>
    </div>`;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function toIso(date: string) {
  return `${date}T00:00:00.000-03:00`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function midDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const mid = new Date(Math.floor((s + e) / 2));
  return mid.toISOString().split("T")[0];
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchProgressoExercicio(studentId: string, inicio: string, fim: string) {
  const { data } = await supabase.rpc("rpc_get_progresso_exercicios", {
    p_aluno_id: studentId,
  });
  if (!data) return [];
  const inicioMs = new Date(inicio).getTime();
  const fimMs = new Date(fim).getTime() + 86400000;
  return (data as any[]).map((ex: any) => ({
    titulo: ex.nome,
    evolucao: ex.evolucao,
    total_sessoes: ex.total_sessoes,
    historico: (ex.historico ?? []).filter((h: any) => {
      const d = new Date(h.data).getTime();
      return d >= inicioMs && d <= fimMs;
    }),
  }));
}

async function fetchAjudaSessao(studentId: string, inicio: string, fim: string) {
  const { data } = await supabase.rpc("rpc_get_grafico_autonomia_aluno", {
    p_aluno_id: studentId,
    p_data_inicio: toIso(inicio),
    p_data_fim: toIso(fim),
  });
  const sessoes = (data as any)?.sessoes ?? [];
  return sessoes as { sessao_id: string; ajuda_intrusiva: number; autonomo: number }[];
}

async function fetchComportamentos(studentId: string, inicio: string, fim: string) {
  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id")
    .eq("aluno_id", studentId)
    .gte("data_inicio", inicio)
    .lte("data_inicio", fim);

  const ids = (sessoes ?? []).map((s: any) => s.id);
  if (!ids.length) return {};

  const { data } = await supabase
    .from("comportamentos_sessao")
    .select("tipo")
    .in("sessao_id", ids)
    .neq("tipo", "outro");

  const counts: Record<string, number> = {
    estereotipia: 0,
    contato_visual: 0,
    engajamento: 0,
    fuga: 0,
    crise: 0,
  };
  (data ?? []).forEach((b: any) => {
    if (b.tipo in counts) counts[b.tipo]++;
  });
  return counts;
}

async function fetchComparacao(studentId: string, inicio: string, fim: string) {
  const meio = midDate(inicio, fim);
  const { data } = await supabase.rpc("rpc_comparar_desempenho_periodos", {
    p_aluno_id: studentId,
    p_p1_inicio: toIso(inicio),
    p_p1_fim: toIso(meio),
    p_p2_inicio: toIso(meio),
    p_p2_fim: toIso(fim),
  });
  return typeof data === "string" ? JSON.parse(data) : data;
}

async function fetchConsolidado(studentId: string, inicio: string, fim: string) {
  const { data } = await supabase.rpc("rpc_get_relatorio_consolidado_aluno", {
    p_aluno_id: studentId,
  });
  if (!data) return null;
  const inicioMs = new Date(inicio).getTime();
  const fimMs = new Date(fim).getTime() + 86400000;
  const filterByDate = (list: any[]) =>
    list.filter((item: any) => {
      const d = new Date(item.data ?? item.data_sessao).getTime();
      return d >= inicioMs && d <= fimMs;
    });
  return {
    historico_cars: filterByDate(data.historico_cars ?? []),
    historico_ata: filterByDate(data.historico_ata ?? []),
    historico_mabc2: filterByDate(data.historico_mabc2 ?? []),
    registros_controle: filterByDate(data.registros_controle ?? []),
  };
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

const CARD = `border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px;background:#f8fafc;page-break-inside:avoid;`;
const TH_STYLE = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD_STYLE = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

function tableRow(cells: string[], header = false): string {
  const style = header ? TH_STYLE : TD_STYLE;
  const tag = header ? "th" : "td";
  return `<tr>${cells.map((c) => `<${tag} style="${style}">${c}</${tag}>`).join("")}</tr>`;
}

function calcVariation(p1: number, p2: number): string {
  const diff = p2 - p1;
  if (p1 === 0 && p2 === 0) return "0 (0%)";
  const pct = p1 === 0 ? 100 : Math.round((diff / p1) * 100);
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff} (${sign}${pct}%)`;
}

function sectionCard(title: string, content: string): string {
  return `<div style="${CARD}">
    <h3 style="font-size:13px;font-weight:bold;color:#1e293b;margin:0 0 12px">${title}</h3>
    ${content}
  </div>`;
}

// ─── MABC-2 category scores fetcher ──────────────────────────────────────────

async function fetchMabc2CategoryScores(recordIds: string[]): Promise<Record<string, any>> {
  if (!recordIds.length) return {};
  const { data } = await supabase
    .from("formularios")
    .select("id, metadados")
    .in("id", recordIds);
  const map: Record<string, any> = {};
  (data ?? []).forEach((row: any) => {
    const meta = typeof row.metadados === "string" ? JSON.parse(row.metadados) : (row.metadados ?? {});
    map[row.id] = meta.componentes ?? {};
  });
  return map;
}

// ─── SVG chart builders ───────────────────────────────────────────────────────

function svgProgressoExercicio(ex: any): string {
  const nivelY: Record<string, number> = { inicial: 80, intermediario: 45, maduro: 10 };
  const hist = ex.historico ?? [];
  if (!hist.length) return `<p style="color:#888;font-size:11px">Sem dados.</p>`;
  const stepX = Math.min(500 / (hist.length + 1), 60);
  const leftPad = 75;
  const svgW = Math.min(leftPad + hist.length * stepX + 30, 560);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="120" style="font-family:Arial,sans-serif">
    <text x="0" y="14" font-size="9" fill="#888">Maduro</text>
    <text x="0" y="49" font-size="9" fill="#888">Intermediário</text>
    <text x="0" y="84" font-size="9" fill="#888">Inicial</text>
    <line x1="${leftPad}" y1="10" x2="${svgW - 10}" y2="10" stroke="#e5e7eb" stroke-dasharray="3"/>
    <line x1="${leftPad}" y1="45" x2="${svgW - 10}" y2="45" stroke="#e5e7eb" stroke-dasharray="3"/>
    <line x1="${leftPad}" y1="80" x2="${svgW - 10}" y2="80" stroke="#e5e7eb" stroke-dasharray="3"/>`;
  const points = hist.map((h: any, i: number) => {
    const x = leftPad + (i + 1) * stepX;
    const y = nivelY[h.nivel_desenvolvimento ?? "inicial"] ?? 80;
    return { x, y };
  });
  if (points.length > 1) {
    svg += `<polyline points="${points.map((p: any) => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#0ea5e9" stroke-width="2"/>`;
  }
  points.forEach((p: any, i: number) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#0ea5e9"/>`;
    svg += `<text x="${p.x}" y="100" font-size="8" fill="#888" text-anchor="middle">S${i + 1}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function svgAjudaSessao(sessoes: { ajuda_intrusiva: number; autonomo: number }[]): string {
  const maxVal = Math.max(...sessoes.map((s) => Math.max(s.ajuda_intrusiva, s.autonomo)), 1);
  const barW = 14;
  const gap = 6;
  const groupW = barW * 2 + gap + 8;
  const chartH = 80;
  const baseY = 88;
  const totalW = Math.min(sessoes.length * groupW + 60, 560);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="130" style="font-family:Arial,sans-serif">`;
  sessoes.forEach((s, i) => {
    const x = 30 + i * groupW;
    const hI = (s.ajuda_intrusiva / maxVal) * chartH;
    const hA = (s.autonomo / maxVal) * chartH;
    svg += `<rect x="${x}" y="${baseY - hI}" width="${barW}" height="${hI}" fill="#F0BD02" rx="2"/>`;
    if (s.ajuda_intrusiva > 0) svg += `<text x="${x + barW / 2}" y="${baseY - hI - 3}" font-size="8" fill="#555" text-anchor="middle">${s.ajuda_intrusiva}</text>`;
    svg += `<rect x="${x + barW + gap}" y="${baseY - hA}" width="${barW}" height="${hA}" fill="#09CDDB" rx="2"/>`;
    if (s.autonomo > 0) svg += `<text x="${x + barW + gap + barW / 2}" y="${baseY - hA - 3}" font-size="8" fill="#555" text-anchor="middle">${s.autonomo}</text>`;
    svg += `<text x="${x + (barW * 2 + gap) / 2}" y="${baseY + 12}" font-size="8" fill="#888" text-anchor="middle">S${i + 1}</text>`;
  });
  svg += `<rect x="30" y="108" width="10" height="10" fill="#F0BD02"/>
    <text x="44" y="117" font-size="9" fill="#555">Intrusivo</text>
    <rect x="110" y="108" width="10" height="10" fill="#09CDDB"/>
    <text x="124" y="117" font-size="9" fill="#555">Autônomo</text>
  </svg>`;
  return svg;
}

function svgComportamentos(counts: Record<string, number>): string {
  const labels: Record<string, string> = { estereotipia: "Estereotipia", contato_visual: "Contato visual", engajamento: "Engajamento", fuga: "Fuga", crise: "Crise" };
  const barColors = ["#09CDDB", "#DBBF09", "#34C759", "#CB30E0", "#FF383C"];
  const keys = Object.keys(labels);
  const maxVal = Math.max(...keys.map((k) => counts[k] ?? 0), 1);
  const chartH = 80;
  const barW = 50;
  const gap = 20;
  const baseY = 88;
  const svgW = Math.min(keys.length * (barW + gap) + 40, 560);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="130" style="font-family:Arial,sans-serif">`;
  keys.forEach((k, i) => {
    const val = counts[k] ?? 0;
    const h = (val / maxVal) * chartH;
    const x = 20 + i * (barW + gap);
    svg += `<rect x="${x}" y="${baseY - h}" width="${barW}" height="${h}" fill="${barColors[i]}" rx="3"/>`;
    svg += `<text x="${x + barW / 2}" y="${baseY - h - 4}" font-size="9" fill="#555" text-anchor="middle">${val}</text>`;
    svg += `<text x="${x + barW / 2}" y="${baseY + 14}" font-size="8" fill="#888" text-anchor="middle">${labels[k]}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// ─── Section builders ─────────────────────────────────────────────────────────

function sectionTitle(title: string): string {
  return `<h3 style="font-size:14px;font-weight:bold;color:#0ea5e9;margin:20px 0 8px">${title}</h3>`;
}

async function buildSections(dataMap: Record<string, any>, inicio: string, fim: string): Promise<string> {
  let html = "";
  const meio = midDate(inicio, fim);

  // 1. Progresso por exercício — um card por exercício
  html += sectionTitle("Progresso por exercício");
  const exs: any[] = dataMap.progresso_exercicio ?? [];
  const exsWithData = exs.filter((ex: any) => (ex.historico ?? []).length > 0);
  if (exsWithData.length) {
    exsWithData.forEach((ex: any) => {
      html += sectionCard(ex.titulo, svgProgressoExercicio(ex));
    });
  } else {
    html += sectionCard("Progresso por exercício", `<p style="color:#888;font-size:11px">Sem dados no período.</p>`);
  }

  // 2. Registros de ajuda — card único
  html += sectionTitle("Registros de ajuda por sessão");
  const ajuda: any[] = dataMap.ajuda_sessao ?? [];
  html += sectionCard("Ajuda por sessão",
    ajuda.length ? svgAjudaSessao(ajuda) : `<p style="color:#888;font-size:11px">Sem dados no período.</p>`);

  // 3. Comportamentos — card único
  html += sectionTitle("Comportamentos observados");
  const counts = dataMap.comportamentos ?? {};
  const hasBehaviors = Object.values(counts).some((v: any) => v > 0);
  html += sectionCard("Frequência de comportamentos",
    hasBehaviors ? svgComportamentos(counts) : `<p style="color:#888;font-size:11px">Sem comportamentos registrados.</p>`);

  // 4. Comparar desempenho — um card por sub-seção
  html += sectionTitle("Comparação de desempenho");
  const comp = dataMap.comparar_desempenho;
  if (comp) {
    const { resumo, ajuda: compAjuda, exercicios, comportamentos: compComps } = comp;
    const exerciciosP1 = (exercicios ?? []).filter((e: any) => e.nivel_p1).length;
    const exerciciosP2 = (exercicios ?? []).filter((e: any) => e.nivel_p2).length;
    const ajudaP1 = (compAjuda?.autonomo?.p1 ?? 0) + (compAjuda?.ajuda_intrusiva?.p1 ?? 0);
    const ajudaP2 = (compAjuda?.autonomo?.p2 ?? 0) + (compAjuda?.ajuda_intrusiva?.p2 ?? 0);
    const compKeys = Object.keys(compComps ?? {});
    const compsP1 = compKeys.reduce((s, k) => s + (compComps[k]?.p1 ?? 0), 0);
    const compsP2 = compKeys.reduce((s, k) => s + (compComps[k]?.p2 ?? 0), 0);
    const periodNote = `<p style="font-size:10px;color:#888;margin:0 0 8px">Período 1: ${fmtDate(inicio)} – ${fmtDate(meio)} &nbsp;|&nbsp; Período 2: ${fmtDate(meio)} – ${fmtDate(fim)}<br/>Os períodos correspondem às metades do intervalo selecionado.</p>`;

    // 4a. Resumo
    html += sectionCard("Resumo da comparação", `${periodNote}
      <table style="border-collapse:collapse;width:100%">
        ${tableRow(["Métrica", "Período 1", "Período 2", "Variação"], true)}
        ${tableRow(["Exercícios avaliados", String(exerciciosP1), String(exerciciosP2), calcVariation(exerciciosP1, exerciciosP2)])}
        ${tableRow(["Registros de ajuda", String(ajudaP1), String(ajudaP2), calcVariation(ajudaP1, ajudaP2)])}
        ${tableRow(["Comportamentos observados", String(compsP1), String(compsP2), calcVariation(compsP1, compsP2)])}
        ${tableRow(["Sessões registradas", String(resumo?.sessoes_p1 ?? 0), String(resumo?.sessoes_p2 ?? 0), calcVariation(resumo?.sessoes_p1 ?? 0, resumo?.sessoes_p2 ?? 0)])}
      </table>`);

    // 4b. Exercícios
    const filteredEx = (exercicios ?? []).filter((e: any) => e.nivel_p1 || e.nivel_p2);
    if (filteredEx.length) {
      const LEVEL_MAP: Record<string, number> = { inicial: 1, intermediario: 2, maduro: 3 };
      html += sectionCard("Comparação por exercício", `
        <table style="border-collapse:collapse;width:100%">
          ${tableRow(["Exercício", "Período 1", "Período 2", "Variação"], true)}
          ${filteredEx.map((ex: any) => {
            const n1 = ex.nivel_p1 ? LEVEL_MAP[ex.nivel_p1.toLowerCase()] ?? 0 : 0;
            const n2 = ex.nivel_p2 ? LEVEL_MAP[ex.nivel_p2.toLowerCase()] ?? 0 : 0;
            const diff = n2 - n1;
            const varLabel = diff > 0 ? `+${diff} nível` : diff < 0 ? `${diff} nível` : "0";
            return tableRow([ex.titulo, ex.nivel_p1 ?? "–", ex.nivel_p2 ?? "–", varLabel]);
          }).join("")}
        </table>`);
    }

    // 4c. Ajuda
    if (compAjuda) {
      html += sectionCard("Comparação dos registros de ajuda", `
        <table style="border-collapse:collapse;width:100%">
          ${tableRow(["Tipo", "Período 1", "Período 2", "Variação"], true)}
          ${tableRow(["Ajuda intrusiva", String(compAjuda.ajuda_intrusiva?.p1 ?? 0), String(compAjuda.ajuda_intrusiva?.p2 ?? 0), calcVariation(compAjuda.ajuda_intrusiva?.p1 ?? 0, compAjuda.ajuda_intrusiva?.p2 ?? 0)])}
          ${tableRow(["Autônomo", String(compAjuda.autonomo?.p1 ?? 0), String(compAjuda.autonomo?.p2 ?? 0), calcVariation(compAjuda.autonomo?.p1 ?? 0, compAjuda.autonomo?.p2 ?? 0)])}
        </table>`);
    }

    // 4d. Comportamentos
    if (compComps) {
      const behaviorLabels: Record<string, string> = { estereotipia: "Estereotipias", contato_visual: "Contato visual", engajamento: "Engajamento", fuga: "Fuga", crise: "Crises" };
      html += sectionCard("Comparação dos comportamentos observados", `
        <table style="border-collapse:collapse;width:100%">
          ${tableRow(["Comportamento", "Período 1", "Período 2", "Variação"], true)}
          ${Object.entries(behaviorLabels).map(([key, label]) => {
            const p1 = compComps[key]?.p1 ?? 0;
            const p2 = compComps[key]?.p2 ?? 0;
            return tableRow([label, String(p1), String(p2), calcVariation(p1, p2)]);
          }).join("")}
        </table>`);
    }
  } else {
    html += sectionCard("Comparação de desempenho", `<p style="color:#888;font-size:11px">Dados insuficientes.</p>`);
  }

  // 5. Protocolos — um card por tipo de protocolo
  html += sectionTitle("Protocolos/Testes aplicados");
  const cons = dataMap.protocolos_testes;
  if (cons) {
    const { historico_cars = [], historico_ata = [], historico_mabc2 = [] } = cons;
    if (historico_cars.length || historico_ata.length || historico_mabc2.length) {
      if (historico_cars.length) {
        html += sectionCard("CARS", `
          <table style="border-collapse:collapse;width:100%">${tableRow(["Data", "Responsável", "Pontuação"], true)}
          ${historico_cars.map((i: any) => tableRow([fmtDate(i.data), i.responsavel ?? "–", String(i.pontuacao ?? "–")])).join("")}</table>`);
      }
      if (historico_ata.length) {
        html += sectionCard("ATA", `
          <table style="border-collapse:collapse;width:100%">${tableRow(["Data", "Responsável", "Pontuação"], true)}
          ${historico_ata.map((i: any) => tableRow([fmtDate(i.data), i.responsavel ?? "–", String(i.pontuacao ?? "–")])).join("")}</table>`);
      }
      if (historico_mabc2.length) {
        const catScores = await fetchMabc2CategoryScores(historico_mabc2.map((i: any) => i.id));
        html += sectionCard("MABC-2", `
          <table style="border-collapse:collapse;width:100%">${tableRow(["Data", "Responsável", "Escore", "Percentil", "EP DM", "P DM", "EP MP", "P MP", "EP E", "P E"], true)}
          ${historico_mabc2.map((i: any) => {
            const c = catScores[i.id] ?? {};
            const dm = c.destreza_manual ?? {};
            const mp = c.mirar_pegar ?? {};
            const eq = c.equilibrio ?? {};
            return tableRow([
              fmtDate(i.data), i.responsavel ?? "–", String(i.pontuacao ?? "–"), String(i.percentil ?? "–"),
              String(dm.escore_padrao ?? "–"), String(dm.percentil ?? "–"),
              String(mp.escore_padrao ?? "–"), String(mp.percentil ?? "–"),
              String(eq.escore_padrao ?? "–"), String(eq.percentil ?? "–"),
            ]);
          }).join("")}</table>`);
      }
    } else {
      html += sectionCard("Protocolos/Testes aplicados", `<p style="color:#888;font-size:11px">Nenhum protocolo aplicado no período.</p>`);
    }
  }

  return html;
}

// ─── Public export function ───────────────────────────────────────────────────

export async function exportReports(
  reports: Report[],
  formats: { pdf: boolean; csv: boolean },
  studentName: string,
  studentId: string,
  mode: DeliveryMode = "share",
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error("Selecione ao menos um formato para exportar.");
  }

  const emissao = new Date().toLocaleDateString("pt-BR");
  // Fallback: busca perfil atual quando snapshot não existe (migration pendente)
  const fallbackProfile = await fetchStudentProfile(studentId);

  // Nativo: acumula os arquivos gerados para entregar de uma vez (zip/baixar).
  const files: ExportableFile[] = [];

  for (const report of reports) {
    const { data_inicio, data_fim } = report;

    const [progresso, ajuda, comportamentos, comparacao, consolidado] = await Promise.all([
      fetchProgressoExercicio(studentId, data_inicio, data_fim),
      fetchAjudaSessao(studentId, data_inicio, data_fim),
      fetchComportamentos(studentId, data_inicio, data_fim),
      fetchComparacao(studentId, data_inicio, data_fim),
      fetchConsolidado(studentId, data_inicio, data_fim),
    ]);

    const dataMap: Record<string, any> = {
      progresso_exercicio: progresso,
      ajuda_sessao: ajuda,
      comportamentos,
      comparar_desempenho: comparacao,
      protocolos_testes: consolidado,
    };

    if (formats.pdf) {
      const sectionsHtml = await buildSections(dataMap, data_inicio, data_fim);

      const snapshot = (report.snapshot_aluno as StudentProfile | null) ?? fallbackProfile;
      const studentInfoHtml = snapshot ? buildStudentInfoHtml(snapshot) : "";

      const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 40px; }
  h1 { font-size: 22px; color: #0ea5e9; margin: 0 0 4px; }
  h2 { font-size: 16px; color: #334155; margin: 0 0 2px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 24px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  table { page-break-inside: avoid; }
  svg { page-break-inside: avoid; }
</style>
</head><body>
  <h1>${studentName}</h1>
  <h2>${report.titulo}</h2>
  <p class="meta">Período: ${fmtDate(data_inicio)} – ${fmtDate(data_fim)} &nbsp;|&nbsp; Emitido em: ${emissao}</p>
  <hr/>
  ${studentInfoHtml}
  ${sectionsHtml}
</body></html>`;

      if (Platform.OS === "web") {
        await Print.printAsync({ html });
      } else {
        const result = await Print.printToFileAsync({ html });
        if (result?.uri) {
          const safeName = report.titulo.replace(/[^a-zA-Z0-9]/g, "_");
          const name = `relatorio_${safeName}.pdf`;
          const dest = `${FileSystem.cacheDirectory}${name}`;
          await FileSystem.moveAsync({ from: result.uri, to: dest });
          files.push({ uri: dest, name, mimeType: "application/pdf" });
        }
      }
    }

    if (formats.csv) {
      const rows: string[][] = [["Aluno", "Relatório", "Período", "Emissão"]];
      rows.push([studentName, report.titulo, `${data_inicio} a ${data_fim}`, emissao]);
      rows.push([]);

      const csvProfile = (report.snapshot_aluno as StudentProfile | null) ?? fallbackProfile;
      if (csvProfile) {
        const age = csvProfile.data_nascimento ? `${calcAge(csvProfile.data_nascimento)} anos` : "–";
        rows.push(["Informações da criança"]);
        rows.push(["Nome", "Idade", "Nível de suporte", "Altura", "Peso", "Cintura"]);
        rows.push([
          csvProfile.nome_completo,
          age,
          fmtSupportLevel(csvProfile.nivel_suporte),
          csvProfile.altura != null ? `${csvProfile.altura} cm` : "–",
          csvProfile.peso != null ? `${csvProfile.peso} kg` : "–",
          csvProfile.cintura != null ? `${csvProfile.cintura} cm` : "–",
        ]);
        rows.push([]);
      }

      if (dataMap.progresso_exercicio?.length) {
        rows.push(["Progresso por exercício"]);
        rows.push(["Exercício", "Evolução", "Sessões"]);
        (dataMap.progresso_exercicio as any[]).forEach((ex: any) =>
          rows.push([ex.titulo, ex.evolucao ?? "–", String(ex.total_sessoes ?? 0)])
        );
        rows.push([]);
      }

      if (dataMap.ajuda_sessao?.length) {
        rows.push(["Ajuda por sessão"]);
        rows.push(["Sessão", "Intrusivo", "Autônomo"]);
        (dataMap.ajuda_sessao as any[]).forEach((s: any, i: number) =>
          rows.push([String(i + 1), String(s.ajuda_intrusiva), String(s.autonomo)])
        );
        rows.push([]);
      }

      if (dataMap.comportamentos && Object.values(dataMap.comportamentos).some((v: any) => v > 0)) {
        rows.push(["Comportamentos"]);
        rows.push(["Tipo", "Frequência"]);
        Object.entries(dataMap.comportamentos).forEach(([k, v]) =>
          rows.push([k, String(v)])
        );
        rows.push([]);
      }

      const c = dataMap.protocolos_testes;
      if (c?.historico_cars?.length) {
        rows.push(["CARS"]);
        rows.push(["Data", "Pontuação"]);
        c.historico_cars.forEach((h: any) => rows.push([fmtDate(h.data), String(h.pontuacao ?? "–")]));
        rows.push([]);
      }
      if (c?.historico_ata?.length) {
        rows.push(["ATA"]);
        rows.push(["Data", "Pontuação"]);
        c.historico_ata.forEach((h: any) => rows.push([fmtDate(h.data), String(h.pontuacao ?? "–")]));
        rows.push([]);
      }
      if (c?.historico_mabc2?.length) {
        const catScores = await fetchMabc2CategoryScores(c.historico_mabc2.map((h: any) => h.id));
        rows.push(["MABC-2"]);
        rows.push(["Data", "Escore", "Percentil", "EP DM", "P DM", "EP MP", "P MP", "EP E", "P E"]);
        c.historico_mabc2.forEach((h: any) => {
          const cats = catScores[h.id] ?? {};
          const dm = cats.destreza_manual ?? {};
          const mp = cats.mirar_pegar ?? {};
          const eq = cats.equilibrio ?? {};
          rows.push([
            fmtDate(h.data), String(h.pontuacao ?? "–"), String(h.percentil ?? "–"),
            String(dm.escore_padrao ?? "–"), String(dm.percentil ?? "–"),
            String(mp.escore_padrao ?? "–"), String(mp.percentil ?? "–"),
            String(eq.escore_padrao ?? "–"), String(eq.percentil ?? "–"),
          ]);
        });
        rows.push([]);
      }

      const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const safeName = report.titulo.replace(/[^a-zA-Z0-9]/g, "_");

      if (Platform.OS === "web") {
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio_${safeName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const name = `relatorio_${safeName}.csv`;
        const path = `${FileSystem.cacheDirectory}${name}`;
        // BOM UTF-8 + encoding explícito: sem isso o Android/Excel quebram acentos.
        await FileSystem.writeAsStringAsync(path, "﻿" + csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        files.push({ uri: path, name, mimeType: "text/csv" });
      }
    }
  }

  // Nativo: entrega tudo de uma vez (zip se houver mais de um arquivo, ou baixa).
  if (Platform.OS !== "web" && files.length) {
    await deliverFiles(files, mode, "Exportar relatório");
  }
}
