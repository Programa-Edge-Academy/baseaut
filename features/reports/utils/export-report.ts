import { deliverFiles, type DeliveryMode, type ExportableFile } from "@/lib/export-delivery";
import { pdfDocument, pdfRunningHeaderReport } from "@/lib/pdf-layout";
import type { Locale, TranslationKey } from "@/features/settings/constants/translations";
import {
  localizeFormText,
  localizeMabcComponent,
  localizeMabcUnit,
} from "@/features/forms/utils/form-content-i18n";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";
import { Report } from "../hooks/use-student-reports";

/** Narrows the threaded locale string to the {@link Locale} the localizers expect. */
function asLoc(locale: string): Locale {
  return locale === "en" ? "en" : "pt";
}

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

/**
 * Formats a stored date as a short date in the given locale.
 *
 * @remarks
 * Uses the literal calendar date part (`YYYY-MM-DD`) and builds a *local* Date,
 * so a plain date string is never shifted a day by `new Date(iso)` parsing it as
 * UTC midnight (which prints the previous day in negative-offset timezones like
 * UTC-3). This matches how the in-app report renders the same dates.
 */
function fmtDate(iso: string, locale: string) {
  const datePart = String(iso ?? "").split("T")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : new Date(iso);
  return date.toLocaleDateString(dateLocale(locale));
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

/** Escapes user-supplied text before injecting it into the exported HTML. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Parses a value into a finite number (accepting commas), or null. */
function parseNum(value: any): number | null {
  if (value == null || value === "") return null;
  const parsed = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Keeps the human-readable first line of a question's text. */
function firstLine(text: string): string {
  return String(text ?? "").split("\n")[0].trim();
}

/** Localized label for a help-record type. */
function helpTypeLabel(registro: string, t: T): string {
  return registro === "ajuda_intrusiva"
    ? t("analysis.help.intrusive")
    : t("analysis.help.autonomous");
}

/** One session's per-exercise help records, mirroring the in-app detail modal. */
type HelpSessionExport = {
  label: string;
  dateLabel: string;
  exercises: { name: string; registro: string }[];
};

/**
 * Loads every completed session in range with the help records of each of its
 * executions (mirrors {@link useHelpSessionDetails}), so the export can show the
 * same per-exercise help breakdown the app does under the help chart.
 */
async function fetchHelpSessionDetails(
  studentId: string,
  inicio: string,
  fim: string,
  t: T,
  locale: string,
): Promise<HelpSessionExport[]> {
  const { data: sessionRows } = await supabase
    .from("sessoes")
    .select("id, data_inicio")
    .eq("aluno_id", studentId)
    .eq("status", "concluida")
    .gte("data_inicio", `${inicio}T00:00:00.000Z`)
    .lte("data_inicio", `${fim}T23:59:59.999Z`)
    .order("data_inicio", { ascending: true });
  const sessionList = sessionRows ?? [];
  if (!sessionList.length) return [];

  const sessionIds = sessionList.map((s: any) => s.id);
  const { data: execRows } = await supabase
    .from("execucoes_exercicio")
    .select("id, sessao_id, exercicio_id, registro_ajuda, created_at")
    .in("sessao_id", sessionIds)
    .not("registro_ajuda", "is", null);
  const execs = (execRows ?? []).sort((a: any, b: any) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
  );

  const exercicioIds = [...new Set(execs.map((e: any) => e.exercicio_id))];
  const tituloById = new Map<string, string>();
  if (exercicioIds.length) {
    const { data: exRows } = await supabase
      .from("exercicios")
      .select("id, titulo")
      .in("id", exercicioIds);
    (exRows ?? []).forEach((ex: any) => tituloById.set(ex.id, ex.titulo));
  }

  const bySession = new Map<string, { name: string; registro: string }[]>();
  for (const e of execs) {
    const list = bySession.get(e.sessao_id) ?? [];
    list.push({
      name: tituloById.get(e.exercicio_id) ?? t("export.doc.exercise"),
      registro: e.registro_ajuda,
    });
    bySession.set(e.sessao_id, list);
  }

  return sessionList.map((s: any, index: number) => ({
    label: String(index + 1),
    dateLabel: fmtDate(s.data_inicio, locale),
    exercises: (bySession.get(s.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

/** One observed behavior aggregated with its sessions and exercises. */
type BehaviorDetailExport = {
  label: string;
  occurrences: number;
  sessions: string[];
  exercises: string[];
};

/** Frontend behavior keys and their localized labels, in display order. */
function behaviorDetailLabels(t: T): { key: string; label: string }[] {
  return [
    { key: "stereotypy", label: t("export.doc.behStereotypies") },
    { key: "eye_contact_people", label: t("export.doc.behEyePeople") },
    { key: "eye_contact_objects", label: t("export.doc.behEyeObjects") },
    { key: "engagement", label: t("export.doc.behEngagement") },
    { key: "escape", label: t("export.doc.behEscape") },
    { key: "crisis", label: t("export.doc.behCrises") },
    { key: "unfit", label: t("export.doc.behUnfit") },
    { key: "preferred_activity", label: t("export.doc.behPreferred") },
  ];
}

/**
 * Loads observed behaviors in range grouped by type, with the dates they
 * occurred and the exercises they happened in (mirrors {@link useObservedBehaviors}),
 * so the export can render the same per-behavior detail cards as the app.
 */
async function fetchBehaviorDetails(
  studentId: string,
  inicio: string,
  fim: string,
  t: T,
  locale: string,
): Promise<BehaviorDetailExport[]> {
  const { data: sessoes } = await supabase
    .from("sessoes")
    .select("id, data_inicio")
    .eq("aluno_id", studentId)
    .eq("status", "concluida")
    .gte("data_inicio", toIsoStart(inicio))
    .lte("data_inicio", toIsoEnd(fim));
  const sessionList = sessoes ?? [];
  if (!sessionList.length) return [];

  const sessionIds = sessionList.map((s: any) => s.id);
  const dateBySession = new Map<string, string>();
  sessionList.forEach((s: any) => dateBySession.set(s.id, String(s.data_inicio).split("T")[0]));

  const { data: behaviors } = await supabase
    .from("comportamentos_sessao")
    .select("tipo, execucao_id, sessao_id, observacao")
    .in("sessao_id", sessionIds)
    .neq("tipo", "outro");
  const behaviorList = behaviors ?? [];
  if (!behaviorList.length) return [];

  const resolveType = (tipo: string, obs: string | null): string | undefined => {
    if (tipo === "contato_visual") {
      const o = (obs ?? "").toLowerCase();
      if (o.includes("objeto")) return "eye_contact_objects";
      if (o.includes("pessoa")) return "eye_contact_people";
      return undefined;
    }
    const map: Record<string, string> = {
      estereotipia: "stereotypy",
      engajamento: "engagement",
      fuga: "escape",
      crise: "crisis",
      inapto: "unfit",
      atividade_preferencial: "preferred_activity",
    };
    return map[tipo];
  };

  const execIds = [...new Set(behaviorList.map((b: any) => b.execucao_id).filter(Boolean))];
  const exerciseByExec = new Map<string, string>();
  if (execIds.length) {
    const { data: execData } = await supabase
      .from("execucoes_exercicio")
      .select("id, exercicio_id")
      .in("id", execIds);
    const exIds = [...new Set((execData ?? []).map((e: any) => e.exercicio_id))];
    const tituloById = new Map<string, string>();
    if (exIds.length) {
      const { data: exRows } = await supabase
        .from("exercicios")
        .select("id, titulo")
        .in("id", exIds);
      (exRows ?? []).forEach((ex: any) => tituloById.set(ex.id, ex.titulo));
    }
    (execData ?? []).forEach((e: any) => {
      const titulo = tituloById.get(e.exercicio_id);
      if (titulo) exerciseByExec.set(e.id, titulo);
    });
  }

  const byType = new Map<string, { occurrences: number; dates: Set<string>; exercises: Set<string> }>();
  behaviorList.forEach((b: any) => {
    const type = resolveType(b.tipo, b.observacao);
    if (!type) return;
    const entry = byType.get(type) ?? { occurrences: 0, dates: new Set<string>(), exercises: new Set<string>() };
    entry.occurrences += 1;
    const date = dateBySession.get(b.sessao_id);
    if (date) entry.dates.add(date);
    const exName = b.execucao_id ? exerciseByExec.get(b.execucao_id) : undefined;
    if (exName) entry.exercises.add(exName);
    byType.set(type, entry);
  });

  return behaviorDetailLabels(t)
    .filter(({ key }) => byType.has(key))
    .map(({ key, label }) => {
      const entry = byType.get(key)!;
      const dates = [...entry.dates].sort((a, b) => (a < b ? 1 : -1));
      return {
        label,
        occurrences: entry.occurrences,
        sessions: dates.map((d, i) => `${i + 1}. ${fmtDate(d, locale)}`),
        exercises: [...entry.exercises],
      };
    });
}

/** Structured answer detail for one protocol record. */
type ProtocolAnswerDetail = {
  ata?: {
    sections: {
      title: string;
      valueLabel: string;
      selectedOptions: string[];
      totalOptions: number;
      observation: string | null;
    }[];
    total: number | null;
    hasResponses: boolean;
  };
  cars?: {
    domains: { title: string; scoreLabel: string; observation: string | null }[];
    total: number | null;
    hasResponses: boolean;
  };
  mabc2?: {
    totalScore: number | null;
    totalPercentile: string | null;
    components: {
      title: string;
      categoryScore: number | null;
      categoryPercentile: string | null;
      items: { name: string; rawScore: string }[];
    }[];
  };
};

/** Loads a protocol record's questions and answers (mirrors the in-app detail). */
async function fetchAtaCarsAnswers(formularioId: string) {
  const { data: perguntas } = await supabase
    .from("perguntas")
    .select("id, texto_pergunta, tipo_resposta, opcoes, ordem")
    .eq("formulario_id", formularioId)
    .order("ordem", { ascending: true });
  const { data: respostas } = await supabase
    .from("respostas_formulario")
    .select("pergunta_id, valor_preenchido, valores_selecionados")
    .eq("formulario_id", formularioId);
  const answers = new Map<string, string | null>();
  const selections = new Map<string, string[]>();
  (respostas ?? []).forEach((r: any) => {
    answers.set(r.pergunta_id, r.valor_preenchido);
    if (Array.isArray(r.valores_selecionados)) {
      selections.set(r.pergunta_id, r.valores_selecionados.map(String));
    }
  });
  return { perguntas: perguntas ?? [], answers, selections };
}

/**
 * Loads the per-item/section answers of one protocol record so the export can
 * show them (mirrors {@link useProtocolRecordDetail}). Returns an empty detail
 * on failure so a single bad record never aborts the whole export.
 */
async function fetchProtocolAnswerDetail(
  tipo: "ata" | "cars" | "mabc2",
  recordId: string,
  locale: string,
): Promise<ProtocolAnswerDetail> {
  try {
    if (tipo === "ata") {
      const { perguntas, answers, selections } = await fetchAtaCarsAnswers(recordId);
      let total = 0;
      let hasAny = false;
      const sections: {
        title: string;
        valueLabel: string;
        selectedOptions: string[];
        totalOptions: number;
        observation: string | null;
      }[] = [];

      for (const q of perguntas as any[]) {
        // Each domain is followed by its own optional observation.
        if (q.tipo_resposta === "texto_opcional") {
          const observation = answers.get(q.id);
          if (sections.length > 0) {
            sections[sections.length - 1].observation =
              observation && observation !== "" ? observation : null;
          }
          continue;
        }

        const value = parseNum(answers.get(q.id));
        if (value != null) {
          total += value;
          hasAny = true;
        }

        const available = Array.isArray(q.opcoes?.valores)
          ? (q.opcoes.valores as unknown[]).map(String)
          : [];

        sections.push({
          title: firstLine(localizeFormText(q.texto_pergunta, asLoc(locale))),
          valueLabel: value != null ? String(value) : "—",
          selectedOptions: (selections.get(q.id) ?? []).map((option) =>
            localizeFormText(option, asLoc(locale)),
          ),
          totalOptions: available.length,
          observation: null,
        });
      }
      return { ata: { sections, total: hasAny ? total : null, hasResponses: hasAny } };
    }
    if (tipo === "cars") {
      const { perguntas, answers } = await fetchAtaCarsAnswers(recordId);
      const domains: { title: string; scoreLabel: string; observation: string | null }[] = [];
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
        const score = parseNum(answers.get(q.id));
        if (score != null) {
          total += score;
          hasAny = true;
        }
        domains.push({
          title: firstLine(localizeFormText(q.texto_pergunta, asLoc(locale))),
          scoreLabel: score != null ? String(score).replace(".", ",") : "—",
          observation: null,
        });
      }
      return { cars: { domains, total: hasAny ? total : null, hasResponses: hasAny } };
    }
    const { data } = await supabase.rpc("rpc_get_mabc2_formulario", { p_formulario_id: recordId });
    const payload = (data ?? {}) as any;
    const meta = payload.formulario?.metadados ?? {};
    const itens = (payload.itens ?? []) as any[];
    type Comp = {
      title: string;
      categoryScore: number | null;
      categoryPercentile: string | null;
      items: { name: string; rawScore: string }[];
    };
    const componentMap = new Map<string, Comp>();
    for (const item of itens) {
      const key = item.componente ?? "Outros";
      if (!componentMap.has(key)) {
        componentMap.set(key, {
          title: localizeMabcComponent(key, asLoc(locale)),
          categoryScore: meta?.componentes?.[key]?.escore_padrao ?? null,
          categoryPercentile: meta?.componentes?.[key]?.percentil ?? null,
          items: [],
        });
      }
      const unit = item.unidade ?? "";
      const rawScore =
        item.escore_bruto != null
          ? `${item.escore_bruto} ${localizeMabcUnit(unit, asLoc(locale))}`.trim()
          : "—";
      const localizedItemTitle = firstLine(localizeFormText(item.texto, asLoc(locale)));
      componentMap.get(key)!.items.push({
        name: item.codigo_item
          ? `${item.codigo_item} — ${localizedItemTitle}`
          : localizedItemTitle,
        rawScore,
      });
    }
    return {
      mabc2: {
        totalScore: meta.escore_total ?? null,
        totalPercentile: meta.percentil ?? null,
        components: Array.from(componentMap.values()),
      },
    };
  } catch {
    return {};
  }
}

/** Renders one protocol record (header + score + answers) as an export card. */
function protocolRecordCard(
  tipoLabel: string,
  dateLabel: string,
  responsavel: string | null,
  detail: ProtocolAnswerDetail,
  t: T,
): string {
  const head = (score: string | null) => `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:12px;font-weight:bold;color:#1e293b">${esc(tipoLabel)} — ${esc(dateLabel)}</span>
      ${score != null ? `<span style="font-size:11px;color:#0ea5e9;font-weight:bold">${t("reports.protocol.total")}: ${esc(score)}</span>` : ""}
    </div>
    ${responsavel ? `<div style="font-size:10px;color:#94a3b8;margin-bottom:6px">${t("reports.protocol.responsible")}: ${esc(responsavel)}</div>` : ""}`;

  if (detail.ata) {
    const body = detail.ata.hasResponses
      ? `<table style="border-collapse:collapse;width:100%">
          ${detail.ata.sections
            .map((s) =>
              tableRow([
                esc(
                  [s.title, ...s.selectedOptions.map((o) => `• ${o}`), s.observation ?? ""]
                    .filter(Boolean)
                    .join("\n"),
                ),
                esc(`${s.valueLabel} · ${s.selectedOptions.length}/${s.totalOptions}`),
              ]),
            )
            .join("")}
        </table>`
      : `<p style="color:#888;font-size:11px">${t("reports.protocol.noAnswers")}</p>`;
    return `<div style="${CARD}">${head(detail.ata.total != null ? String(detail.ata.total) : null)}${body}</div>`;
  }
  if (detail.cars) {
    const body = detail.cars.hasResponses
      ? `<table style="border-collapse:collapse;width:100%">
          ${detail.cars.domains
            .map((d) => tableRow([esc(d.title) + (d.observation ? `<br/><span style="color:#94a3b8;font-style:italic">${esc(d.observation)}</span>` : ""), esc(d.scoreLabel)]))
            .join("")}
        </table>`
      : `<p style="color:#888;font-size:11px">${t("reports.protocol.noAnswers")}</p>`;
    return `<div style="${CARD}">${head(detail.cars.total != null ? String(detail.cars.total) : null)}${body}</div>`;
  }
  if (detail.mabc2) {
    const m = detail.mabc2;
    const scoreLine = `
      <div style="font-size:11px;color:#475569;margin-bottom:8px">
        ${m.totalScore != null ? `${t("reports.protocol.totalScore")}: <b>${esc(m.totalScore)}</b>` : ""}
        ${m.totalPercentile != null ? ` &nbsp;|&nbsp; ${t("reports.protocol.percentile")}: <b>${esc(m.totalPercentile)}</b>` : ""}
      </div>`;
    const comps = m.components
      .map(
        (c) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:bold;color:#1e293b;border-bottom:1px solid #e5e7eb;padding-bottom:3px;margin-bottom:3px">
            <span>${esc(c.title)}</span>
            <span>${c.categoryScore != null ? `${t("export.doc.scoreShort")} ${esc(c.categoryScore)}` : ""}${c.categoryPercentile ? ` · ${t("reports.protocol.percentile")} ${esc(c.categoryPercentile)}` : ""}</span>
          </div>
          <table style="border-collapse:collapse;width:100%">
            ${c.items.map((it) => tableRow([esc(it.name), esc(it.rawScore)])).join("")}
          </table>
        </div>`,
      )
      .join("");
    return `<div style="${CARD}">${head(null)}${scoreLine}${comps}</div>`;
  }
  return `<div style="${CARD}">${head(null)}<p style="color:#888;font-size:11px">${t("reports.protocol.noAnswers")}</p></div>`;
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
    svg += `<text x="${p.x}" y="100" font-size="8" fill="#888" text-anchor="middle">${i + 1}</text>`;
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
 * behaviors, comparison, protocols, motor development). Each entry is a full
 * section (title + cards); the caller places each on its own page under a
 * repeating header. Mirrors the in-app report detail so nothing shown in the
 * app is missing from the exported document.
 */
async function buildSections(
  dataMap: Record<string, any>,
  studentId: string,
  inicio: string,
  fim: string,
  t: T,
  locale: string,
): Promise<string[]> {
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
  // Per-exercise help breakdown per session (matches the in-app detail modal).
  const helpDetails = await fetchHelpSessionDetails(studentId, inicio, fim, t, locale);
  if (helpDetails.length) {
    const detailRows = helpDetails
      .flatMap((s) => {
        const sessionLabel = `${t("analysis.helpChart.session")} ${s.label} (${s.dateLabel})`;
        if (!s.exercises.length) {
          return [tableRow([sessionLabel, t("analysis.helpModal.noRecords"), "–"])];
        }
        return s.exercises.map((ex) =>
          tableRow([esc(sessionLabel), esc(ex.name), helpTypeLabel(ex.registro, t)]),
        );
      })
      .join("");
    html += sectionCard(t("analysis.helpModal.title"), `
      <table style="border-collapse:collapse;width:100%">
        ${tableRow([t("export.doc.session"), t("export.doc.exercise"), t("export.doc.type")], true)}
        ${detailRows}
      </table>`);
  }
  sections.push(html);

  html = sectionTitle(t("reports.section.behaviors"));
  const counts = dataMap.comportamentos ?? {};
  const hasBehaviors = Object.values(counts).some((v: any) => v > 0);
  html += sectionCard(t("export.doc.cardBehaviorFreq"),
    hasBehaviors ? svgComportamentos(counts, t) : `<p style="color:#888;font-size:11px">${t("export.doc.noBehaviors")}</p>`);
  // Per-behavior detail cards (occurrences, sessions, exercises) as in the app.
  const behaviorDetails = await fetchBehaviorDetails(studentId, inicio, fim, t, locale);
  behaviorDetails.forEach((b) => {
    html += `<div style="${CARD}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:12px;font-weight:bold;color:#1e293b">${esc(b.label)}</span>
        <span style="font-size:11px;color:#0ea5e9;font-weight:bold">${t("analysis.behavior.occurrences")}: ${b.occurrences}</span>
      </div>
      ${b.sessions.length ? `<div style="font-size:10px;color:#475569;margin-bottom:4px">${t("analysis.behavior.sessions")}: ${b.sessions.map((s) => esc(s)).join(" · ")}</div>` : ""}
      ${b.exercises.length ? `<div style="font-size:10px;color:#475569">${t("analysis.behavior.associatedExercises")}: ${b.exercises.map((e) => esc(e)).join(", ")}</div>` : ""}
    </div>`;
  });
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
        for (const i of historico_cars) {
          const detail = await fetchProtocolAnswerDetail("cars", i.id, locale);
          html += protocolRecordCard("CARS", fmtDate(i.data, locale), i.responsavel ?? null, detail, t);
        }
      }
      if (historico_ata.length) {
        html += sectionCard("ATA", `
          <table style="border-collapse:collapse;width:100%">${tableRow(protocolHeader, true)}
          ${historico_ata.map((i: any) => tableRow([fmtDate(i.data, locale), i.responsavel ?? "–", String(i.pontuacao ?? "–")])).join("")}</table>`);
        for (const i of historico_ata) {
          const detail = await fetchProtocolAnswerDetail("ata", i.id, locale);
          html += protocolRecordCard("ATA", fmtDate(i.data, locale), i.responsavel ?? null, detail, t);
        }
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
        for (const i of historico_mabc2) {
          const detail = await fetchProtocolAnswerDetail("mabc2", i.id, locale);
          html += protocolRecordCard("MABC-2", fmtDate(i.data, locale), i.responsavel ?? null, detail, t);
        }
      }
    } else {
      html += sectionCard(t("reports.section.protocols"), `<p style="color:#888;font-size:11px">${t("export.doc.noProtocolPeriod")}</p>`);
    }
  }
  sections.push(html);

  // Motor development: the session Control Records and their answers.
  html = sectionTitle(t("reports.section.motor"));
  const rcs: any[] = cons?.registros_controle ?? [];
  if (rcs.length) {
    rcs.forEach((rc: any) => {
      const respostas: any[] = rc.respostas ?? [];
      const body = respostas.length
        ? respostas
            .map(
              (r: any) => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eef2f7;font-size:11px">
                <span style="color:#475569;flex:1;margin-right:8px">${esc(localizeFormText(r.pergunta, asLoc(locale)))}</span>
                <span style="color:#1e293b;font-weight:bold">${esc(r.valor ?? "–")}</span>
              </div>`,
            )
            .join("")
        : `<p style="color:#888;font-size:11px">${t("reports.noAnswers")}</p>`;
      html += sectionCard(
        `${fmtDate(rc.data_sessao, locale)} — ${esc(rc.monitor ?? t("reports.noMonitor"))}`,
        body,
      );
    });
  } else {
    html += sectionCard(t("reports.section.motor"), `<p style="color:#888;font-size:11px">${t("reports.empty.motor")}</p>`);
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
      const sections = await buildSections(dataMap, studentId, data_inicio, data_fim, t, locale);

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

      // Per-exercise help records per session (matches the in-app detail modal).
      const helpDetailsCsv = await fetchHelpSessionDetails(studentId, data_inicio, data_fim, t, locale);
      if (helpDetailsCsv.length) {
        rows.push([t("analysis.helpModal.title")]);
        rows.push([t("export.doc.session"), t("export.doc.date"), t("export.doc.exercise"), t("export.doc.type")]);
        helpDetailsCsv.forEach((s) => {
          if (!s.exercises.length) {
            rows.push([s.label, s.dateLabel, t("analysis.helpModal.noRecords"), "–"]);
          } else {
            s.exercises.forEach((ex) => rows.push([s.label, s.dateLabel, ex.name, helpTypeLabel(ex.registro, t)]));
          }
        });
        rows.push([]);
      }

      // Per-behavior detail (occurrences, sessions, exercises).
      const behaviorDetailsCsv = await fetchBehaviorDetails(studentId, data_inicio, data_fim, t, locale);
      if (behaviorDetailsCsv.length) {
        rows.push([t("analysis.behaviorsScreen.detailsTitle")]);
        rows.push([t("export.doc.behavior"), t("analysis.behavior.occurrences"), t("analysis.behavior.sessions"), t("analysis.behavior.associatedExercises")]);
        behaviorDetailsCsv.forEach((b) =>
          rows.push([b.label, String(b.occurrences), b.sessions.join(" | "), b.exercises.join(" | ")]),
        );
        rows.push([]);
      }

      // Protocol answers per record.
      const pushProtocolAnswers = async (tipo: "ata" | "cars" | "mabc2", records: any[]) => {
        for (const rec of records) {
          const detail = await fetchProtocolAnswerDetail(tipo, rec.id, locale);
          if (detail.ata) {
            rows.push([`ATA — ${fmtDate(rec.data, locale)}`, detail.ata.total != null ? `${t("reports.protocol.total")}: ${detail.ata.total}` : ""]);
            detail.ata.sections.forEach((s) =>
              rows.push([
                s.title,
                s.valueLabel,
                `${s.selectedOptions.length}/${s.totalOptions}`,
                s.selectedOptions.join(" | "),
                s.observation ?? "",
              ]),
            );
            rows.push([]);
          } else if (detail.cars) {
            rows.push([`CARS — ${fmtDate(rec.data, locale)}`, detail.cars.total != null ? `${t("reports.protocol.total")}: ${detail.cars.total}` : ""]);
            detail.cars.domains.forEach((d) => rows.push([d.title, d.scoreLabel, d.observation ?? ""]));
            rows.push([]);
          } else if (detail.mabc2) {
            rows.push([`MABC-2 — ${fmtDate(rec.data, locale)}`, detail.mabc2.totalScore != null ? `${t("reports.protocol.totalScore")}: ${detail.mabc2.totalScore}` : ""]);
            detail.mabc2.components.forEach((comp) => {
              rows.push([comp.title, comp.categoryScore != null ? `${t("export.doc.scoreShort")}: ${comp.categoryScore}` : "", comp.categoryPercentile ? `${t("reports.protocol.percentile")}: ${comp.categoryPercentile}` : ""]);
              comp.items.forEach((it) => rows.push([it.name, it.rawScore]));
            });
            rows.push([]);
          }
        }
      };
      if (c?.historico_ata?.length) await pushProtocolAnswers("ata", c.historico_ata);
      if (c?.historico_cars?.length) await pushProtocolAnswers("cars", c.historico_cars);
      if (c?.historico_mabc2?.length) await pushProtocolAnswers("mabc2", c.historico_mabc2);

      // Motor development: session Control Records and their answers.
      const rcsCsv: any[] = c?.registros_controle ?? [];
      if (rcsCsv.length) {
        rows.push([t("reports.section.motor")]);
        rcsCsv.forEach((rc: any) => {
          rows.push([fmtDate(rc.data_sessao, locale), rc.monitor ?? t("reports.noMonitor")]);
          (rc.respostas ?? []).forEach((r: any) =>
            rows.push([localizeFormText(r.pergunta, asLoc(locale)), String(r.valor ?? "–")]),
          );
          rows.push([]);
        });
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
      const sections = await buildSections(dataMap, student.id, dataInicio, dataFim, t, locale);
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
