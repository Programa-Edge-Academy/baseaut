import { deliverFiles, type DeliveryMode, type ExportableFile } from "@/lib/export-delivery";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";

export type FormExportData = {
  formularioId: string;
  /** Nome exibido (ex.: "ATA", "CARS"). */
  title: string;
  studentName: string;
};

const TH = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

type FormRow = { pergunta: string; resposta: string };

/** Converte o valor salvo (texto ou JSON) em uma representação legível. */
function displayValue(valor: string | null | undefined): string {
  if (valor == null || valor === "") return "–";
  try {
    const parsed = JSON.parse(valor);
    if (Array.isArray(parsed)) return parsed.length ? parsed.join(", ") : "–";
    if (parsed && typeof parsed === "object") {
      if ("selected" in parsed) {
        const sel = (parsed as any).selected;
        if (Array.isArray(sel)) return sel.length ? sel.join(", ") : "–";
        return sel != null && sel !== "" ? String(sel) : "–";
      }
      return JSON.stringify(parsed);
    }
    return String(parsed);
  } catch {
    return String(valor);
  }
}

async function fetchFormRows(formularioId: string): Promise<FormRow[]> {
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
    const titulo = (q.texto_pergunta || "").split(/\n(?=\(0=)/)[0].trim();
    return { pergunta: titulo, resposta: displayValue(respByQ.get(q.id)) };
  });
}

export async function exportForm(
  data: FormExportData,
  formats: { pdf: boolean; csv: boolean },
  mode: DeliveryMode = "share",
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error("Selecione ao menos um formato para exportar.");
  }

  const emissao = new Date().toLocaleDateString("pt-BR");
  const safeName = `${data.title}_${data.studentName}`.replace(/[^a-zA-Z0-9]/g, "_");
  const rows = await fetchFormRows(data.formularioId);

  const buildPdfHtml = () => `<!DOCTYPE html>
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
  <h1>${data.title}</h1>
  <h2>${data.studentName}</h2>
  <p class="meta">Emitido em: ${emissao}</p>
  <hr/>
  <table>
    <thead><tr><th style="${TH}">Pergunta</th><th style="${TH}">Resposta</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr><td style="${TD}">${r.pergunta}</td><td style="${TD}">${r.resposta}</td></tr>`,
      )
      .join("")}</tbody>
  </table>
</body></html>`;

  const buildCsv = () => {
    const allRows: string[][] = [
      [data.title, "Aluno", "Emissão"],
      ["", data.studentName, emissao],
      [],
      ["Pergunta", "Resposta"],
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

  await deliverFiles(files, mode, `Exportar ${data.title}`);
}
