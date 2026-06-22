import type {
  Mabc2Draft,
} from "@/features/analysis/hooks/use-mabc2-records";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TH = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

function str(value: string | number | null | undefined): string {
  return value != null ? String(value) : "–";
}

// ─── Public export ────────────────────────────────────────────────────────────

export async function exportMabc(
  draft: Mabc2Draft,
  formats: { pdf: boolean; csv: boolean },
  studentName: string
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error("Selecione ao menos um formato para exportar.");
  }

  const emissao = new Date().toLocaleDateString("pt-BR");
  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");

  if (formats.pdf) {
    const sectionRows = draft.sections
      .map((section) => {
        const exerciseRows = section.exercises
          .map(
            (ex) => `
          <tr>
            <td style="${TD}"></td>
            <td style="${TD}">${ex.name}</td>
            <td style="${TD}">${str(ex.score)}</td>
            <td style="${TD}">${str(ex.attemptCount)}</td>
            <td style="${TD}">${ex.unit ?? "–"}</td>
          </tr>`
          )
          .join("");

        return `
        <tr style="background:#f8fafc">
          <td style="${TH}" colspan="2">${section.title}</td>
          <td style="${TH}">Escore: ${str(section.categoryScore)}</td>
          <td style="${TH}">Percentil: ${str(section.categoryPercentile)}</td>
          <td style="${TH}"></td>
        </tr>
        ${exerciseRows}`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 40px; }
  h1 { font-size: 20px; color: #0ea5e9; margin: 0 0 4px; }
  h2 { font-size: 14px; color: #334155; margin: 0 0 2px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 24px; }
  .totals { font-size: 13px; color: #1e293b; margin-bottom: 16px; font-weight: bold; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
</style>
</head><body>
  <h1>MABC-2</h1>
  <h2>${studentName}</h2>
  <p class="meta">Emitido em: ${emissao}</p>
  <p class="totals">
    Escore Total: ${str(draft.totalScore)} &nbsp;|&nbsp;
    Percentil Total: ${str(draft.totalPercentile)}
  </p>
  <hr/>
  <table>
    <thead>
      <tr>
        <th style="${TH}">Categoria</th>
        <th style="${TH}">Exercício</th>
        <th style="${TH}">Pontuação</th>
        <th style="${TH}">Tentativas</th>
        <th style="${TH}">Unidade</th>
      </tr>
    </thead>
    <tbody>${sectionRows}</tbody>
  </table>
</body></html>`;

    if (Platform.OS === "web") {
      await Print.printAsync({ html });
    } else {
      const result = await Print.printToFileAsync({ html });
      if (result?.uri) {
        const dest = `${FileSystem.cacheDirectory}mabc2_${safeName}.pdf`;
        await FileSystem.moveAsync({ from: result.uri, to: dest });
        await Sharing.shareAsync(dest, {
          mimeType: "application/pdf",
          dialogTitle: "Exportar MABC-2",
        });
      }
    }
  }

  if (formats.csv) {
    const rows: string[][] = [
      ["MABC-2", "Aluno", "Emissão"],
      ["", studentName, emissao],
      [],
      ["Escore Total", str(draft.totalScore), "Percentil Total", str(draft.totalPercentile)],
      [],
      ["Categoria", "Escore Categoria", "Percentil Categoria", "Exercício", "Pontuação", "Tentativas", "Unidade"],
    ];

    for (const section of draft.sections) {
      for (const ex of section.exercises) {
        rows.push([
          section.title,
          str(section.categoryScore),
          str(section.categoryPercentile),
          ex.name,
          str(ex.score),
          str(ex.attemptCount),
          ex.unit ?? "–",
        ]);
      }
    }

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    if (Platform.OS === "web") {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mabc2_${safeName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const path = `${FileSystem.cacheDirectory}mabc2_${safeName}.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Exportar MABC-2",
      });
    }
  }
}
