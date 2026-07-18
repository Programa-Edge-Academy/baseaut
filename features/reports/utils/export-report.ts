import { deliverFiles, type DeliveryMode, type ExportableFile } from "@/lib/export-delivery";
import { pdfDocument, pdfRunningHeaderReport } from "@/lib/pdf-layout";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";
import { Report } from "../hooks/use-student-reports";

/** Localized string getter threaded through the export builders. */
type T = (key: TranslationKey) => string;

/** Resolves the `toLocaleDateString` locale tag for the active app locale. */
function dateLocale(locale: string): string {
  return locale === "en" ? "en-US" : "pt-BR";
}

/** Student profile fields embedded in an exported report. */
type StudentProfile = {
  nome_completo: string;
  altura: number | null;
  peso: number | null;
  cintura: number | null;
  data_nascimento: string | null;
  nivel_suporte: string | null;
  observacoes_clinicas: string | null;
};

/** Loads the current student profile, used as a fallback when no snapshot exists. */
async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const { data } = await supabase
    .from("alunos")
    .select("nome_completo, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas")
    .eq("id", studentId)
    .single();
  return (data as StudentProfile) ?? null;
}

/** Returns the age in completed years for a birth date. */
function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Maps a stored support level code to its display label. */
function fmtSupportLevel(raw: string | null, t: T): string {
  if (!raw) return "–";
  if (raw === "nivel_1") return t("reports.supportLevel1");
  if (raw === "nivel_2") return t("reports.supportLevel2");
  if (raw === "nivel_3") return t("reports.supportLevel3");
  return raw;
}

/**
 * Builds the student information block of the PDF report, including the
 * report's snapshot image when available.
 */
function buildStudentInfoHtml(profile: StudentProfile, t: T, imageUrl?: string | null): string {
  const chip = (label: string, value: string) =>
    `<td style="padding:6px 10px;border:1px solid #e2e8f0;vertical-align:top">
       <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">${label}</div>
       <div style="font-size:12px;color:#1e293b;font-weight:bold">${value}</div>
     </td>`;
  const age = profile.data_nascimento ? `${calcAge(profile.data_nascimento)} ${t("export.doc.years")}` : "–";
  const imageHtml = imageUrl
    ? `<div style="text-align:center;margin-bottom:12px">
         <img src="${imageUrl}" style="width:110px;height:110px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0"/>
       </div>`
    : "";
  return `
    <div style="margin-bottom:24px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;page-break-inside:avoid">
      <p style="font-size:14px;font-weight:bold;color:#1e293b;margin:0 0 12px">${t("export.doc.childInfo")}</p>
      ${imageHtml}
      <table style="border-collapse:collapse;width:100%">
        <tr>
          ${chip(t("export.doc.name"), profile.nome_completo)}
          ${chip(t("export.doc.age"), age)}
          ${chip(t("export.doc.supportLevel"), fmtSupportLevel(profile.nivel_suporte, t))}
        </tr>
        <tr>
          ${chip(t("export.doc.height"), profile.altura != null ? `${profile.altura} cm` : "–")}
          ${chip(t("export.doc.weight"), profile.peso != null ? `${profile.peso} kg` : "–")}
          ${chip(t("export.doc.waist"), profile.cintura != null ? `${profile.cintura} cm` : "–")}
        </tr>
        ${profile.observacoes_clinicas ? `<tr><td colspan="3" style="padding:6px 10px;border:1px solid #e2e8f0">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">${t("export.doc.clinicalObs")}</div>
          <div style="font-size:12px;color:#1e293b">${profile.observacoes_clinicas}</div>
        </td></tr>` : ""}
      </table>
    </div>`;
}


/** Converts a `YYYY-MM-DD` date into an ISO string at start of day (UTC-3). */
function toIsoStart(date: string) {
  return `${date}T00:00:00.000-03:00`;
}

/** Converts a `YYYY-MM-DD` date into an ISO string at end of day (UTC-3). */
function toIsoEnd(date: string) {
  return `${date}T23:59:59.999-03:00`;
}

/** Formats an ISO date as a short date in the given locale. */
function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(dateLocale(locale));
}

/** Returns the midpoint date between two dates, used to split comparison periods. */
function midDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const mid = new Date(Math.floor((s + e) / 2));
  return mid.toISOString().split("T")[0];
}

/** Returns the very next day (YYYY-MM-DD) to prevent period overlap. */
function nextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

/** Fetches exercise progress filtered to the given date range. */
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

/** Fetches per-session autonomy/help counts in range. */
async function fetchAjudaSessao(studentId: string, inicio: string, fim: string) {
  const { data } = await supabase.rpc("rpc_get_grafico_autonomia_aluno", {
    p_aluno_id: studentId,
    p_data_inicio: toIsoStart(inicio),
    p_data_fim: toIsoEnd(fim),
  });
  const sessoes = (data as any)?.sessoes ?? [];
  return sessoes as { sessao_id: string; ajuda_intrusiva: number; autonomo: number }[];
}

/** Fetches and counts observed behaviors for completed sessions in range. */
async function fetchComportamentos(studentId: string, inicio: string, fim: string) {
  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id")
    .eq("aluno_id", studentId)
    .eq("status", "concluida")
    .gte("data_inicio", toIsoStart(inicio))
    .lte("data_inicio", toIsoEnd(fim));

  const ids = (sessoes ?? []).map((s: any) => s.id);
  if (!ids.length) return {};

  const { data } = await supabase
    .from("comportamentos_sessao")
    .select("tipo, observacao")
    .in("sessao_id", ids)
    .neq("tipo", "outro");

  const counts: Record<string, number> = {
    estereotipia: 0,
    contato_visual_pessoas: 0,
    contato_visual_objetos: 0,
    engajamento: 0,
    fuga: 0,
    crise: 0,
    inapto: 0,
    atividade_preferencial: 0,
  };
  (data ?? []).forEach((b: any) => {
    if (b.tipo === "contato_visual") {
      const obs = String(b.observacao ?? "").toLowerCase();
      if (obs.includes("objeto")) counts.contato_visual_objetos++;
      else if (obs.includes("pessoa")) counts.contato_visual_pessoas++;
      return;
    }
    if (b.tipo in counts) counts[b.tipo]++;
  });
  return counts;
}

/** Fetches the performance comparison between the two halves of the range. */
async function fetchComparacao(studentId: string, inicio: string, fim: string) {
  const meio = midDate(inicio, fim);
  const inicioPeriodo2 = nextDay(meio);
  const { data } = await supabase.rpc("rpc_comparar_desempenho_periodos", {
    p_aluno_id: studentId,
    p_p1_inicio: toIsoStart(inicio),
    p_p1_fim: toIsoEnd(meio),
    p_p2_inicio: toIsoStart(inicioPeriodo2),
    p_p2_fim: toIsoEnd(fim),
  });
  return typeof data === "string" ? JSON.parse(data) : data;
}

/** Fetches the consolidated protocol/record history filtered to the range. */
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


const CARD = `border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px;background:#f8fafc;page-break-inside:avoid;`;
const TH_STYLE = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD_STYLE = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

/** Builds an HTML table row from cell values, as header or body. */
function tableRow(cells: string[], header = false): string {
  const style = header ? TH_STYLE : TD_STYLE;
  const tag = header ? "th" : "td";
  return `<tr>${cells.map((c) => `<${tag} style="${style}">${c}</${tag}>`).join("")}</tr>`;
}

/** Formats the absolute and percentage variation between two values. */
function calcVariation(p1: number, p2: number): string {
  const diff = p2 - p1;
  if (p1 === 0 && p2 === 0) return "0 (0%)";
  const pct = p1 === 0 ? 100 : Math.round((diff / p1) * 100);
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff} (${sign}${pct}%)`;
}

/** Wraps content in a titled card container for the PDF. */
function sectionCard(title: string, content: string): string {
  return `<div style="${CARD}">
    <h3 style="font-size:13px;font-weight:bold;color:#1e293b;margin:0 0 12px">${title}</h3>
    ${content}
  </div>`;
}


/** Loads per-category MABC-2 scores from each record's metadata. */
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


/** Renders an SVG line chart of an exercise's development level over sessions. */
function svgProgressoExercicio(ex: any, t: T): string {
  const nivelY: Record<string, number> = { inicial: 80, intermediario: 45, maduro: 10 };
  const hist = ex.historico ?? [];
  if (!hist.length) return `<p style="color:#888;font-size:11px">${t("export.doc.noData")}</p>`;
  const stepX = Math.min(500 / (hist.length + 1), 60);
  const leftPad = 75;
  const svgW = Math.min(leftPad + hist.length * stepX + 30, 560);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="120" style="font-family:Arial,sans-serif">
    <text x="0" y="14" font-size="9" fill="#888">${t("analysis.level.maduro")}</text>
    <text x="0" y="49" font-size="9" fill="#888">${t("analysis.level.intermediario")}</text>
    <text x="0" y="84" font-size="9" fill="#888">${t("analysis.level.inicial")}</text>
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

/** Renders an SVG grouped bar chart of intrusive vs autonomous help per session. */
function svgAjudaSessao(sessoes: { ajuda_intrusiva: number; autonomo: number }[], t: T): string {
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
    <text x="44" y="117" font-size="9" fill="#555">${t("export.doc.intrusive")}</text>
    <rect x="110" y="108" width="10" height="10" fill="#09CDDB"/>
    <text x="124" y="117" font-size="9" fill="#555">${t("analysis.help.autonomous")}</text>
  </svg>`;
  return svg;
}

/** Renders an SVG bar chart of observed behavior frequencies. */
function svgComportamentos(counts: Record<string, number>, t: T): string {
  const labels: Record<string, string> = { estereotipia: t("export.doc.behStereotypy"), contato_visual_pessoas: t("export.doc.behEyePeopleShort"), contato_visual_objetos: t("export.doc.behEyeObjectsShort"), engajamento: t("export.doc.behEngagement"), fuga: t("export.doc.behEscape"), crise: t("export.doc.behCrisis"), inapto: t("export.doc.behUnfitShort"), atividade_preferencial: t("export.doc.behPreferredShort") };
  const barColors = ["#09CDDB", "#DBBF09", "#A6900A", "#34C759", "#CB30E0", "#FF383C", "#FF8A00", "#1E88E5"];
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


/** Builds an accent-colored section title for the PDF. */
function sectionTitle(title: string): string {
  return `<h3 style="font-size:14px;font-weight:bold;color:#0ea5e9;margin:20px 0 8px">${title}</h3>`;
}

/**
 * Assembles the report's content as an array of major sections (progress, help,
 * behaviors, comparison, protocols). Each entry is a full section (title +
 * cards); the caller places each on its own page under a repeating header.
 */
async function buildSections(dataMap: Record<string, any>, inicio: string, fim: string, t: T, locale: string): Promise<string[]> {
  const sections: string[] = [];
  const meio = midDate(inicio, fim);
  const noDataPeriod = `<p style="color:#888;font-size:11px">${t("export.doc.noDataPeriod")}</p>`;

  let html = sectionTitle(t("reports.section.progress"));
  const exs: any[] = dataMap.progresso_exercicio ?? [];
  const exsWithData = exs.filter((ex: any) => (ex.historico ?? []).length > 0);
  if (exsWithData.length) {
    exsWithData.forEach((ex: any) => {
      html += sectionCard(ex.titulo, svgProgressoExercicio(ex, t));
    });
  } else {
    html += sectionCard(t("reports.section.progress"), noDataPeriod);
  }
  sections.push(html);

  html = sectionTitle(t("reports.section.help"));
  const ajuda: any[] = dataMap.ajuda_sessao ?? [];
  html += sectionCard(t("export.doc.cardHelpPerSession"),
    ajuda.length ? svgAjudaSessao(ajuda, t) : noDataPeriod);
  sections.push(html);

  html = sectionTitle(t("reports.section.behaviors"));
  const counts = dataMap.comportamentos ?? {};
  const hasBehaviors = Object.values(counts).some((v: any) => v > 0);
  html += sectionCard(t("export.doc.cardBehaviorFreq"),
    hasBehaviors ? svgComportamentos(counts, t) : `<p style="color:#888;font-size:11px">${t("export.doc.noBehaviors")}</p>`);
  sections.push(html);

  html = sectionTitle(t("reports.section.comparison"));
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
    const p1L = t("analysis.period1");
    const p2L = t("analysis.period2");
    const varL = t("analysis.variation");
    const periodNote = `<p style="font-size:10px;color:#888;margin:0 0 8px">${p1L}: ${fmtDate(inicio, locale)} – ${fmtDate(meio, locale)} &nbsp;|&nbsp; ${p2L}: ${fmtDate(meio, locale)} – ${fmtDate(fim, locale)}<br/>${t("export.doc.periodNote")}</p>`;

    html += sectionCard(t("export.doc.cardComparisonSummary"), `${periodNote}
      <table style="border-collapse:collapse;width:100%">
        ${tableRow([t("export.doc.metric"), p1L, p2L, varL], true)}
        ${tableRow([t("analysis.summary.exercisesEvaluated"), String(exerciciosP1), String(exerciciosP2), calcVariation(exerciciosP1, exerciciosP2)])}
        ${tableRow([t("analysis.summary.helpRecords"), String(ajudaP1), String(ajudaP2), calcVariation(ajudaP1, ajudaP2)])}
        ${tableRow([t("analysis.summary.behaviors"), String(compsP1), String(compsP2), calcVariation(compsP1, compsP2)])}
        ${tableRow([t("analysis.summary.sessions"), String(resumo?.sessoes_p1 ?? 0), String(resumo?.sessoes_p2 ?? 0), calcVariation(resumo?.sessoes_p1 ?? 0, resumo?.sessoes_p2 ?? 0)])}
      </table>`);

    const filteredEx = (exercicios ?? []).filter((e: any) => e.nivel_p1 || e.nivel_p2);
    if (filteredEx.length) {
      const LEVEL_MAP: Record<string, number> = { inicial: 1, intermediario: 2, maduro: 3 };
      const levelUnit = t("export.doc.levelUnit");
      html += sectionCard(t("export.doc.cardByExercise"), `
        <table style="border-collapse:collapse;width:100%">
          ${tableRow([t("export.doc.exercise"), p1L, p2L, varL], true)}
          ${filteredEx.map((ex: any) => {
            const n1 = ex.nivel_p1 ? LEVEL_MAP[ex.nivel_p1.toLowerCase()] ?? 0 : 0;
            const n2 = ex.nivel_p2 ? LEVEL_MAP[ex.nivel_p2.toLowerCase()] ?? 0 : 0;
            const diff = n2 - n1;
            const varLabel = diff > 0 ? `+${diff} ${levelUnit}` : diff < 0 ? `${diff} ${levelUnit}` : "0";
            return tableRow([ex.titulo, ex.nivel_p1 ?? "–", ex.nivel_p2 ?? "–", varLabel]);
          }).join("")}
        </table>`);
    }

    if (compAjuda) {
      html += sectionCard(t("export.doc.cardHelpComparison"), `
        <table style="border-collapse:collapse;width:100%">
          ${tableRow([t("export.doc.type"), p1L, p2L, varL], true)}
          ${tableRow([t("analysis.help.intrusive"), String(compAjuda.ajuda_intrusiva?.p1 ?? 0), String(compAjuda.ajuda_intrusiva?.p2 ?? 0), calcVariation(compAjuda.ajuda_intrusiva?.p1 ?? 0, compAjuda.ajuda_intrusiva?.p2 ?? 0)])}
          ${tableRow([t("analysis.help.autonomous"), String(compAjuda.autonomo?.p1 ?? 0), String(compAjuda.autonomo?.p2 ?? 0), calcVariation(compAjuda.autonomo?.p1 ?? 0, compAjuda.autonomo?.p2 ?? 0)])}
        </table>`);
    }

    if (compComps) {
      const behaviorLabels: Record<string, string> = { estereotipia: t("export.doc.behStereotypies"), contato_visual_pessoas: t("export.doc.behEyePeople"), contato_visual_objetos: t("export.doc.behEyeObjects"), engajamento: t("export.doc.behEngagement"), fuga: t("export.doc.behEscape"), crise: t("export.doc.behCrises"), inapto: t("export.doc.behUnfit"), atividade_preferencial: t("export.doc.behPreferred") };
      html += sectionCard(t("export.doc.cardBehaviorComparison"), `
        <table style="border-collapse:collapse;width:100%">
          ${tableRow([t("export.doc.behavior"), p1L, p2L, varL], true)}
          ${Object.entries(behaviorLabels).map(([key, label]) => {
            const p1 = compComps[key]?.p1 ?? 0;
            const p2 = compComps[key]?.p2 ?? 0;
            return tableRow([label, String(p1), String(p2), calcVariation(p1, p2)]);
          }).join("")}
        </table>`);
    }
  } else {
    html += sectionCard(t("reports.section.comparison"), `<p style="color:#888;font-size:11px">${t("export.doc.insufficient")}</p>`);
  }
  sections.push(html);

  html = sectionTitle(t("reports.section.protocols"));
  const cons = dataMap.protocolos_testes;
  if (cons) {
    const { historico_cars = [], historico_ata = [], historico_mabc2 = [] } = cons;
    if (historico_cars.length || historico_ata.length || historico_mabc2.length) {
      const protocolHeader = [t("export.doc.date"), t("reports.protocol.responsible"), t("export.doc.score")];
      if (historico_cars.length) {
        html += sectionCard("CARS", `
          <table style="border-collapse:collapse;width:100%">${tableRow(protocolHeader, true)}
          ${historico_cars.map((i: any) => tableRow([fmtDate(i.data, locale), i.responsavel ?? "–", String(i.pontuacao ?? "–")])).join("")}</table>`);
      }
      if (historico_ata.length) {
        html += sectionCard("ATA", `
          <table style="border-collapse:collapse;width:100%">${tableRow(protocolHeader, true)}
          ${historico_ata.map((i: any) => tableRow([fmtDate(i.data, locale), i.responsavel ?? "–", String(i.pontuacao ?? "–")])).join("")}</table>`);
      }
      if (historico_mabc2.length) {
        const catScores = await fetchMabc2CategoryScores(historico_mabc2.map((i: any) => i.id));
        html += sectionCard("MABC-2", `
          <table style="border-collapse:collapse;width:100%">${tableRow([t("export.doc.date"), t("reports.protocol.responsible"), t("export.doc.scoreShort"), t("reports.protocol.percentile"), t("export.doc.ssMd"), t("export.doc.pMd"), t("export.doc.ssAc"), t("export.doc.pAc"), t("export.doc.ssB"), t("export.doc.pB")], true)}
          ${historico_mabc2.map((i: any) => {
            const c = catScores[i.id] ?? {};
            const dm = c.destreza_manual ?? {};
            const mp = c.mirar_pegar ?? {};
            const eq = c.equilibrio ?? {};
            return tableRow([
              fmtDate(i.data, locale), i.responsavel ?? "–", String(i.pontuacao ?? "–"), String(i.percentil ?? "–"),
              String(dm.escore_padrao ?? "–"), String(dm.percentil ?? "–"),
              String(mp.escore_padrao ?? "–"), String(mp.percentil ?? "–"),
              String(eq.escore_padrao ?? "–"), String(eq.percentil ?? "–"),
            ]);
          }).join("")}</table>`);
      }
    } else {
      html += sectionCard(t("reports.section.protocols"), `<p style="color:#888;font-size:11px">${t("export.doc.noProtocolPeriod")}</p>`);
    }
  }
  sections.push(html);

  return sections;
}


/**
 * Exports one or more reports as PDF and/or CSV and delivers them via share or
 * direct download. Each report aggregates progress, help, behavior, comparison,
 * and protocol data for its date range; on native, multiple files are bundled.
 *
 * @param reports - Reports to export.
 * @param formats - Which file formats to generate (at least one required).
 * @param studentName - Student name shown in the export header.
 * @param studentId - Student id used to fetch the report data.
 * @param mode - Delivery mode for native platforms. Defaults to "share".
 */
export async function exportReports(
  reports: Report[],
  formats: { pdf: boolean; csv: boolean },
  studentName: string,
  studentId: string,
  t: T,
  locale: string,
  mode: DeliveryMode = "share",
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error(t("export.selectAtLeastOne"));
  }

  const emissao = new Date().toLocaleDateString(dateLocale(locale));
  const fallbackProfile = await fetchStudentProfile(studentId);

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
      const sections = await buildSections(dataMap, data_inicio, data_fim, t, locale);

      const snapshot = (report.snapshot_aluno as StudentProfile | null) ?? fallbackProfile;
      const studentInfoHtml = snapshot
        ? buildStudentInfoHtml(snapshot, t, report.imagem_url)
        : "";

      // Student identification + report metadata form the running header that
      // repeats on every page of this report's section.
      const runningHeader = `
        <h1>${studentName}</h1>
        <h2>${report.titulo}</h2>
        <p class="meta">${t("export.doc.period")}: ${fmtDate(data_inicio, locale)} – ${fmtDate(data_fim, locale)} &nbsp;|&nbsp; ${t("export.issuedOn")}: ${emissao}</p>
        ${studentInfoHtml}`;

      const html = pdfDocument(pdfRunningHeaderReport(runningHeader, sections));

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
      const rows: string[][] = [[t("export.doc.student"), t("export.doc.report"), t("export.doc.period"), t("export.issue")]];
      rows.push([studentName, report.titulo, `${data_inicio} a ${data_fim}`, emissao]);
      rows.push([]);

      const csvProfile = (report.snapshot_aluno as StudentProfile | null) ?? fallbackProfile;
      if (csvProfile) {
        const age = csvProfile.data_nascimento ? `${calcAge(csvProfile.data_nascimento)} ${t("export.doc.years")}` : "–";
        rows.push([t("export.doc.childInfo")]);
        rows.push([t("export.doc.name"), t("export.doc.age"), t("export.doc.supportLevel"), t("export.doc.height"), t("export.doc.weight"), t("export.doc.waist")]);
        rows.push([
          csvProfile.nome_completo,
          age,
          fmtSupportLevel(csvProfile.nivel_suporte, t),
          csvProfile.altura != null ? `${csvProfile.altura} cm` : "–",
          csvProfile.peso != null ? `${csvProfile.peso} kg` : "–",
          csvProfile.cintura != null ? `${csvProfile.cintura} cm` : "–",
        ]);
        rows.push([]);
      }

      if (dataMap.progresso_exercicio?.length) {
        rows.push([t("reports.section.progress")]);
        rows.push([t("export.doc.exercise"), t("export.doc.evolution"), t("export.doc.sessions")]);
        (dataMap.progresso_exercicio as any[]).forEach((ex: any) =>
          rows.push([ex.titulo, ex.evolucao ?? "–", String(ex.total_sessoes ?? 0)])
        );
        rows.push([]);
      }

      if (dataMap.ajuda_sessao?.length) {
        rows.push([t("export.doc.cardHelpPerSession")]);
        rows.push([t("export.doc.session"), t("export.doc.intrusive"), t("analysis.help.autonomous")]);
        (dataMap.ajuda_sessao as any[]).forEach((s: any, i: number) =>
          rows.push([String(i + 1), String(s.ajuda_intrusiva), String(s.autonomo)])
        );
        rows.push([]);
      }

      if (dataMap.comportamentos && Object.values(dataMap.comportamentos).some((v: any) => v > 0)) {
        rows.push([t("export.doc.behaviors")]);
        rows.push([t("export.doc.type"), t("export.doc.frequency")]);
        Object.entries(dataMap.comportamentos).forEach(([k, v]) =>
          rows.push([k, String(v)])
        );
        rows.push([]);
      }

      const c = dataMap.protocolos_testes;
      if (c?.historico_cars?.length) {
        rows.push(["CARS"]);
        rows.push([t("export.doc.date"), t("export.doc.score")]);
        c.historico_cars.forEach((h: any) => rows.push([fmtDate(h.data, locale), String(h.pontuacao ?? "–")]));
        rows.push([]);
      }
      if (c?.historico_ata?.length) {
        rows.push(["ATA"]);
        rows.push([t("export.doc.date"), t("export.doc.score")]);
        c.historico_ata.forEach((h: any) => rows.push([fmtDate(h.data, locale), String(h.pontuacao ?? "–")]));
        rows.push([]);
      }
      if (c?.historico_mabc2?.length) {
        const catScores = await fetchMabc2CategoryScores(c.historico_mabc2.map((h: any) => h.id));
        rows.push(["MABC-2"]);
        rows.push([t("export.doc.date"), t("export.doc.scoreShort"), t("reports.protocol.percentile"), t("export.doc.ssMd"), t("export.doc.pMd"), t("export.doc.ssAc"), t("export.doc.pAc"), t("export.doc.ssB"), t("export.doc.pB")]);
        c.historico_mabc2.forEach((h: any) => {
          const cats = catScores[h.id] ?? {};
          const dm = cats.destreza_manual ?? {};
          const mp = cats.mirar_pegar ?? {};
          const eq = cats.equilibrio ?? {};
          rows.push([
            fmtDate(h.data, locale), String(h.pontuacao ?? "–"), String(h.percentil ?? "–"),
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
        await FileSystem.writeAsStringAsync(path, "﻿" + csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        files.push({ uri: path, name, mimeType: "text/csv" });
      }
    }
  }

  if (Platform.OS !== "web" && files.length) {
    await deliverFiles(files, mode, t("export.doc.shareTitle"));
  }
}

/** Minimal student identification used by {@link exportConsolidatedReport}. */
export type ConsolidatedStudent = {
  id: string;
  name: string;
};

/** Per-student aggregate metrics shown in the consolidated summary table. */
type ConsolidatedSummary = {
  name: string;
  sessoes: number;
  exerciciosAvaliados: number;
  melhorou: number;
  estavel: number;
  precisaReforco: number;
  autonomo: number;
  intrusiva: number;
  comportamentos: number;
};

/**
 * Exports a single consolidated report crossing the data of several students
 * over one period. The document opens with a comparative summary table (one
 * row per student) followed by each student's full evolution sections — the
 * same progress, help, behavior, comparison and protocol content used by the
 * individual report export.
 *
 * @param students - Students whose data will be crossed.
 * @param dataInicio - Period start in `YYYY-MM-DD`.
 * @param dataFim - Period end in `YYYY-MM-DD`.
 * @param formats - Which file formats to generate (at least one required).
 * @param mode - Delivery mode for native platforms. Defaults to "share".
 */
export async function exportConsolidatedReport(
  students: ConsolidatedStudent[],
  dataInicio: string,
  dataFim: string,
  formats: { pdf: boolean; csv: boolean },
  t: T,
  locale: string,
  mode: DeliveryMode = "share",
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error(t("export.selectAtLeastOne"));
  }
  if (!students.length) {
    throw new Error(t("export.doc.selectAtLeastOneStudent"));
  }

  const emissao = new Date().toLocaleDateString(dateLocale(locale));
  const summaries: ConsolidatedSummary[] = [];
  const studentSectionsHtml: string[] = [];
  const csvRows: string[][] = [];

  for (const student of students) {
    const [profile, progresso, ajuda, comportamentos, comparacao, consolidado] =
      await Promise.all([
        fetchStudentProfile(student.id),
        fetchProgressoExercicio(student.id, dataInicio, dataFim),
        fetchAjudaSessao(student.id, dataInicio, dataFim),
        fetchComportamentos(student.id, dataInicio, dataFim),
        fetchComparacao(student.id, dataInicio, dataFim),
        fetchConsolidado(student.id, dataInicio, dataFim),
      ]);

    const dataMap: Record<string, any> = {
      progresso_exercicio: progresso,
      ajuda_sessao: ajuda,
      comportamentos,
      comparar_desempenho: comparacao,
      protocolos_testes: consolidado,
    };

    const exsComDados = (progresso as any[]).filter(
      (ex: any) => (ex.historico ?? []).length > 0,
    );
    const countEvolucao = (label: string) =>
      exsComDados.filter((ex: any) => ex.evolucao === label).length;
    const totalComportamentos = Object.values(
      (comportamentos ?? {}) as Record<string, number>,
    ).reduce((sum, v) => sum + v, 0);

    summaries.push({
      name: student.name,
      sessoes:
        (comparacao?.resumo?.sessoes_p1 ?? 0) + (comparacao?.resumo?.sessoes_p2 ?? 0),
      exerciciosAvaliados: exsComDados.length,
      melhorou: countEvolucao("Melhorou"),
      estavel: countEvolucao("Estável"),
      precisaReforco: countEvolucao("Precisa reforço"),
      autonomo: (ajuda as any[]).reduce((s, a) => s + (a.autonomo ?? 0), 0),
      intrusiva: (ajuda as any[]).reduce((s, a) => s + (a.ajuda_intrusiva ?? 0), 0),
      comportamentos: totalComportamentos,
    });

    if (formats.pdf) {
      const sections = await buildSections(dataMap, dataInicio, dataFim, t, locale);
      const infoHtml = profile ? buildStudentInfoHtml(profile, t) : "";
      // Each student is a new section (new page) whose identifying data repeats
      // as the running header across all of that student's pages.
      const studentHeader = `<h2 style="font-size:18px;color:#0ea5e9;margin:0 0 10px">${student.name}</h2>${infoHtml}`;
      studentSectionsHtml.push(
        pdfRunningHeaderReport(studentHeader, sections, { breakBefore: true }),
      );
    }

    if (formats.csv) {
      csvRows.push([student.name]);
      csvRows.push([t("export.doc.exercise"), t("export.doc.evolution"), t("export.doc.sessions")]);
      (progresso as any[]).forEach((ex: any) =>
        csvRows.push([ex.titulo, ex.evolucao ?? "–", String(ex.total_sessoes ?? 0)]),
      );
      csvRows.push([]);
    }
  }

  const files: ExportableFile[] = [];

  const summaryHeader = [
    t("export.doc.student"), t("export.doc.sessions"), t("export.doc.exercises"),
    t("export.doc.improved"), t("export.doc.stable"), t("export.doc.needsReinforcement"),
    t("analysis.help.autonomous"), t("analysis.help.intrusive"), t("export.doc.behaviors"),
  ];

  if (formats.pdf) {
    const summaryTable = `
      <table style="border-collapse:collapse;width:100%">
        ${tableRow(summaryHeader, true)}
        ${summaries
          .map((s) =>
            tableRow([
              s.name,
              String(s.sessoes),
              String(s.exerciciosAvaliados),
              String(s.melhorou),
              String(s.estavel),
              String(s.precisaReforco),
              String(s.autonomo),
              String(s.intrusiva),
              String(s.comportamentos),
            ]),
          )
          .join("")}
      </table>`;

    const overview = `
      <h1>${t("export.doc.consolidatedTitle")}</h1>
      <p class="meta">${t("export.doc.students")}: ${students.map((s) => s.name).join(", ")}<br/>
      ${t("export.doc.period")}: ${fmtDate(dataInicio, locale)} – ${fmtDate(dataFim, locale)} &nbsp;|&nbsp; ${t("export.issuedOn")}: ${emissao}</p>
      <hr/>
      ${sectionCard(t("export.doc.studentsSummary"), summaryTable)}`;

    const html = pdfDocument(`${overview}${studentSectionsHtml.join("")}`);

    if (Platform.OS === "web") {
      await Print.printAsync({ html });
    } else {
      const result = await Print.printToFileAsync({ html });
      if (result?.uri) {
        const name = "relatorio_consolidado.pdf";
        const dest = `${FileSystem.cacheDirectory}${name}`;
        await FileSystem.moveAsync({ from: result.uri, to: dest });
        files.push({ uri: dest, name, mimeType: "application/pdf" });
      }
    }
  }

  if (formats.csv) {
    const rows: string[][] = [
      [t("export.doc.consolidatedTitle"), `${dataInicio} a ${dataFim}`, `${t("export.issue")}: ${emissao}`],
      [],
      summaryHeader,
      ...summaries.map((s) => [
        s.name,
        String(s.sessoes),
        String(s.exerciciosAvaliados),
        String(s.melhorou),
        String(s.estavel),
        String(s.precisaReforco),
        String(s.autonomo),
        String(s.intrusiva),
        String(s.comportamentos),
      ]),
      [],
      ...csvRows,
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    if (Platform.OS === "web") {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio_consolidado.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const name = "relatorio_consolidado.csv";
      const path = `${FileSystem.cacheDirectory}${name}`;
      await FileSystem.writeAsStringAsync(path, "﻿" + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      files.push({ uri: path, name, mimeType: "text/csv" });
    }
  }

  if (Platform.OS !== "web" && files.length) {
    await deliverFiles(files, mode, t("export.doc.shareConsolidatedTitle"));
  }
}
