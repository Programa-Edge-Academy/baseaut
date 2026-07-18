import { formatAnswer } from "@/features/forms/utils/format-answer";
import { localizeFormText } from "@/features/forms/utils/form-content-i18n";
import { pdfDocument, pdfRunningHeaderReport } from "@/lib/pdf-layout";
import type { Locale, TranslationKey } from "@/features/settings/constants/translations";
import { deliverFiles, type DeliveryMode, type ExportableFile } from "@/lib/export-delivery";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";

/** Data required to export a form instance. */
export type FormExportData = {
  formularioId: string;
  /** Display name (e.g. "ATA", "CARS"). */
  title: string;
  studentName: string;
};

const TH = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

/** A question/answer pair prepared for export. */
type FormRow = { pergunta: string; resposta: string };

/** Loads a form's questions and their answers, joined into localized export rows. */
async function fetchFormRows(formularioId: string, locale: Locale): Promise<FormRow[]> {
  const { data: form } = await supabase
    .from("formularios")
    .select("template_origem_id")
    .eq("id", formularioId)
    .maybeSingle();

  const sourceId = form?.template_origem_id ?? formularioId;

  const [{ data: perguntas }, { data: respostas }] = await Promise.all([
    supabase
      .from("perguntas")
      .select("id, texto_pergunta, ordem")
      .eq("formulario_id", sourceId)
      .order("ordem", { ascending: true }),
    supabase
      .from("respostas_formulario")
      .select("pergunta_id, valor_preenchido")
      .eq("formulario_id", formularioId),
  ]);

  const respByQ = new Map(
    (respostas ?? []).map((r) => [r.pergunta_id, r.valor_preenchido]),
  );

  return (perguntas ?? []).map((q) => {
    const titulo = localizeFormText(q.texto_pergunta || "", locale)
      .split(/\n(?=\(0=)/)[0]
      .trim();
    return { pergunta: titulo, resposta: formatAnswer(respByQ.get(q.id), locale) };
  });
}

/**
 * Exports a form instance as PDF and/or CSV and delivers the files via share or
 * direct download. On web it prints/downloads directly.
 *
 * @param data - The form and student identifying the export.
 * @param formats - Which file formats to generate (at least one required).
 * @param mode - Delivery mode for native platforms. Defaults to "share".
 */
export async function exportForm(
  data: FormExportData,
  formats: { pdf: boolean; csv: boolean },
  t: (key: TranslationKey) => string,
  locale: string,
  mode: DeliveryMode = "share",
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error(t("export.selectAtLeastOne"));
  }

  const emissao = new Date().toLocaleDateString(locale === "en" ? "en-US" : "pt-BR");
  const safeName = `${data.title}_${data.studentName}`.replace(/[^a-zA-Z0-9]/g, "_");
  const rows = await fetchFormRows(data.formularioId, locale === "en" ? "en" : "pt");

  const buildPdfHtml = () => {
    // Form + student identification repeat as the running header on every page.
    const runningHeader = `
      <h1>${data.title}</h1>
      <h2>${data.studentName}</h2>
      <p class="meta">${t("export.issuedOn")}: ${emissao}</p>`;
    const answersSection = `
  <table style="border-collapse:collapse;width:100%">
    <thead><tr><th style="${TH}">${t("export.doc.question")}</th><th style="${TH}">${t("export.doc.answer")}</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr><td style="${TD}">${r.pergunta}</td><td style="${TD}">${r.resposta}</td></tr>`,
      )
      .join("")}</tbody>
  </table>`;
    return pdfDocument(pdfRunningHeaderReport(runningHeader, [answersSection]));
  };

  const buildCsv = () => {
    const allRows: string[][] = [
      [data.title, t("export.doc.student"), t("export.issue")],
      ["", data.studentName, emissao],
      [],
      [t("export.doc.question"), t("export.doc.answer")],
      ...rows.map((r) => [r.pergunta, r.resposta]),
    ];
    return allRows
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
      a.download = `${safeName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    return;
  }

  const files: ExportableFile[] = [];

  if (formats.pdf) {
    const result = await Print.printToFileAsync({ html: buildPdfHtml() });
    if (result?.uri) {
      const name = `${safeName}.pdf`;
      const dest = `${FileSystem.cacheDirectory}${name}`;
      await FileSystem.moveAsync({ from: result.uri, to: dest });
      files.push({ uri: dest, name, mimeType: "application/pdf" });
    }
  }

  if (formats.csv) {
    const name = `${safeName}.csv`;
    const path = `${FileSystem.cacheDirectory}${name}`;
    await FileSystem.writeAsStringAsync(path, "﻿" + buildCsv(), {
      encoding: FileSystem.EncodingType.UTF8,
    });
    files.push({ uri: path, name, mimeType: "text/csv" });
  }

  await deliverFiles(files, mode, t("export.doc.shareFormTitle").replace("{title}", data.title));
}
