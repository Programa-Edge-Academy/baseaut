import type {
  ActivityRecordItem,
} from "@/features/sessions/components/activity-record-card";
import { formatAnswer } from "@/features/forms/utils/format-answer";
import { localizeFormText } from "@/features/forms/utils/form-content-i18n";
import type { Locale, TranslationKey } from "@/features/settings/constants/translations";
import { deliverFiles, type DeliveryMode, type ExportableFile } from "@/lib/export-delivery";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";

/** Localized string getter threaded through the export builders. */
type T = (key: TranslationKey) => string;

/** Data required to export a session. */
export type SessionExportData = {
  /** Required to attach the session's Control Record. */
  sessionId?: string;
  sessionTitle: string;
  sessionDate: string;
  studentName: string;
  executions: ActivityRecordItem[];
};

const TH = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

/** Formats seconds as mm:ss, or an en dash when null. */
function fmtDuration(seconds: number | null): string {
  if (seconds === null) return "–";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Maps a development-level value to its display label. */
function fmtNivel(nivel: string | null, t: T): string {
  if (nivel === "inicial") return t("analysis.level.inicial");
  if (nivel === "intermediario") return t("analysis.level.intermediario");
  if (nivel === "maduro") return t("analysis.level.maduro");
  return "–";
}

/** Formats the help registration and its complements into a label. */
function fmtAjuda(ajuda: string | null, complementos: string[] | null, t: T): string {
  if (ajuda === "autonomo") {
    const suffix =
      complementos?.length
        ? ` (${complementos.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")})`
        : "";
    return `${t("analysis.help.autonomous")}${suffix}`;
  }
  if (ajuda === "ajuda_intrusiva") return t("analysis.help.intrusive");
  return "–";
}

/** A Control Record question/answer pair prepared for export. */
type RcRow = { pergunta: string; resposta: string };

/**
 * Loads the session's Control Record and its answers. Questions live on the
 * template (`template_origem_id`); answers live on the instance.
 */
async function fetchRcForSession(sessionId: string, locale: Locale): Promise<RcRow[]> {
  const { data: sessao } = await supabase
    .from("sessoes")
    .select("formulario_id")
    .eq("id", sessionId)
    .maybeSingle();

  const formId = sessao?.formulario_id;
  if (!formId) return [];

  const { data: form } = await supabase
    .from("formularios")
    .select("template_origem_id")
    .eq("id", formId)
    .maybeSingle();

  const sourceId = form?.template_origem_id ?? formId;

  const [{ data: perguntas }, { data: respostas }] = await Promise.all([
    supabase
      .from("perguntas")
      .select("id, texto_pergunta, ordem")
      .eq("formulario_id", sourceId)
      .order("ordem", { ascending: true }),
    supabase
      .from("respostas_formulario")
      .select("pergunta_id, valor_preenchido")
      .eq("formulario_id", formId)
      .eq("sessao_id", sessionId),
  ]);

  const respByQ = new Map(
    (respostas ?? []).map((r) => [r.pergunta_id, r.valor_preenchido]),
  );

  return (perguntas ?? []).map((q) => {
    const titulo = localizeFormText(q.texto_pergunta || "", locale)
      .split(/\n(?=\(0=)/)[0]
      .trim();
    return {
      pergunta: titulo,
      resposta: formatAnswer(respByQ.get(q.id), locale),
    };
  });
}

/**
 * Exports a session as PDF and/or CSV (including its Control Record when
 * available) and delivers the files via share or direct download. On web it
 * prints/downloads directly.
 *
 * @param data - The session and its executions to export.
 * @param formats - Which file formats to generate (at least one required).
 * @param mode - Delivery mode for native platforms. Defaults to "share".
 */
export async function exportSession(
  data: SessionExportData,
  formats: { pdf: boolean; csv: boolean },
  t: T,
  locale: string,
  mode: DeliveryMode = "share",
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error(t("export.selectAtLeastOne"));
  }

  const emissao = new Date().toLocaleDateString(locale === "en" ? "en-US" : "pt-BR");
  const safeName = data.sessionTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const rcRows = data.sessionId
    ? await fetchRcForSession(data.sessionId, locale === "en" ? "en" : "pt")
    : [];

  const buildPdfHtml = () => {
    const bodyRows = data.executions
      .map(
        (exec) => `
      <tr>
        <td style="${TD}">${exec.title}</td>
        <td style="${TD}">${fmtDuration(exec.durationSeconds)}</td>
        <td style="${TD}">${fmtNivel(exec.nivelDesenvolvimento, t)}</td>
        <td style="${TD}">${fmtAjuda(exec.registroAjuda, exec.complementosAjuda, t)}</td>
      </tr>`,
      )
      .join("");

    const rcHtml = rcRows.length
      ? `
  <h2 style="margin-top:24px">${t("sessionDetail.controlRecord")}</h2>
  <table>
    <thead><tr><th style="${TH}">${t("export.doc.question")}</th><th style="${TH}">${t("export.doc.answer")}</th></tr></thead>
    <tbody>${rcRows
      .map(
        (r) => `<tr><td style="${TD}">${r.pergunta}</td><td style="${TD}">${r.resposta}</td></tr>`,
      )
      .join("")}</tbody>
  </table>`
      : "";

    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 40px; }
  h1 { font-size: 20px; color: #0ea5e9; margin: 0 0 4px; }
  h2 { font-size: 14px; color: #334155; margin: 0 0 2px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 24px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
</style>
</head><body>
  <h1>${data.sessionTitle}</h1>
  <h2>${data.studentName}</h2>
  <p class="meta">${t("export.doc.date")}: ${data.sessionDate} &nbsp;|&nbsp; ${t("export.issuedOn")}: ${emissao}</p>
  <hr/>
  <table>
    <thead>
      <tr>
        <th style="${TH}">${t("export.doc.exercise")}</th>
        <th style="${TH}">${t("export.doc.duration")}</th>
        <th style="${TH}">${t("export.doc.devLevel")}</th>
        <th style="${TH}">${t("export.doc.helpLevel")}</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${rcHtml}
</body></html>`;
  };

  const buildCsv = () => {
    const rows: string[][] = [
      [t("export.doc.session"), t("export.doc.student"), t("export.doc.date"), t("export.issue")],
      [data.sessionTitle, data.studentName, data.sessionDate, emissao],
      [],
      [t("export.doc.exercise"), t("export.doc.duration"), t("export.doc.devLevel"), t("export.doc.helpLevel")],
      ...data.executions.map((exec) => [
        exec.title,
        fmtDuration(exec.durationSeconds),
        fmtNivel(exec.nivelDesenvolvimento, t),
        fmtAjuda(exec.registroAjuda, exec.complementosAjuda, t),
      ]),
    ];

    if (rcRows.length) {
      rows.push([], [t("sessionDetail.controlRecord")], [t("export.doc.question"), t("export.doc.answer")]);
      rcRows.forEach((r) => rows.push([r.pergunta, r.resposta]));
    }

    return rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  };

  if (Platform.OS === "web") {
    if (formats.pdf) {
      await Print.printAsync({ html: buildPdfHtml() });
    }
    if (formats.csv) {
      const blob = new Blob(["﻿" + buildCsv()], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sessao_${safeName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    return;
  }

  const files: ExportableFile[] = [];

  if (formats.pdf) {
    const result = await Print.printToFileAsync({ html: buildPdfHtml() });
    if (result?.uri) {
      const name = `sessao_${safeName}.pdf`;
      const dest = `${FileSystem.cacheDirectory}${name}`;
      await FileSystem.moveAsync({ from: result.uri, to: dest });
      files.push({ uri: dest, name, mimeType: "application/pdf" });
    }
  }

  if (formats.csv) {
    const name = `sessao_${safeName}.csv`;
    const path = `${FileSystem.cacheDirectory}${name}`;
    await FileSystem.writeAsStringAsync(path, "﻿" + buildCsv(), {
      encoding: FileSystem.EncodingType.UTF8,
    });
    files.push({ uri: path, name, mimeType: "text/csv" });
  }

  await deliverFiles(files, mode, t("export.doc.shareSessionTitle"));
}
