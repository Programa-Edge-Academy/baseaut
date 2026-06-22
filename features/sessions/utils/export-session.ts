import type {
  ActivityRecordItem,
} from "@/features/sessions/components/activity-record-card";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type SessionExportData = {
  sessionTitle: string;
  sessionDate: string;
  studentName: string;
  executions: ActivityRecordItem[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TH = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;background:#f1f5f9;font-weight:bold;`;
const TD = `border:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:11px;`;

function fmtDuration(seconds: number | null): string {
  if (seconds === null) return "–";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtNivel(nivel: string | null): string {
  if (nivel === "inicial") return "Inicial";
  if (nivel === "intermediario") return "Intermediário";
  if (nivel === "maduro") return "Maduro";
  return "–";
}

function fmtAjuda(ajuda: string | null, complementos: string[] | null): string {
  if (ajuda === "autonomo") {
    const suffix =
      complementos?.length
        ? ` (${complementos.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")})`
        : "";
    return `Autônomo${suffix}`;
  }
  if (ajuda === "ajuda_intrusiva") return "Ajuda intrusiva";
  return "–";
}

// ─── Public export ────────────────────────────────────────────────────────────

export async function exportSession(
  data: SessionExportData,
  formats: { pdf: boolean; csv: boolean }
): Promise<void> {
  if (!formats.pdf && !formats.csv) {
    throw new Error("Selecione ao menos um formato para exportar.");
  }

  const emissao = new Date().toLocaleDateString("pt-BR");
  const safeName = data.sessionTitle.replace(/[^a-zA-Z0-9]/g, "_");

  if (formats.pdf) {
    const bodyRows = data.executions
      .map(
        (exec) => `
      <tr>
        <td style="${TD}">${exec.title}</td>
        <td style="${TD}">${fmtDuration(exec.durationSeconds)}</td>
        <td style="${TD}">${fmtNivel(exec.nivelDesenvolvimento)}</td>
        <td style="${TD}">${fmtAjuda(exec.registroAjuda, exec.complementosAjuda)}</td>
      </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
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
  <p class="meta">Data: ${data.sessionDate} &nbsp;|&nbsp; Emitido em: ${emissao}</p>
  <hr/>
  <table>
    <thead>
      <tr>
        <th style="${TH}">Exercício</th>
        <th style="${TH}">Duração</th>
        <th style="${TH}">Nível de desenvolvimento</th>
        <th style="${TH}">Nível de ajuda</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body></html>`;

    if (Platform.OS === "web") {
      await Print.printAsync({ html });
    } else {
      const result = await Print.printToFileAsync({ html });
      if (result?.uri) {
        const dest = `${FileSystem.cacheDirectory}sessao_${safeName}.pdf`;
        await FileSystem.moveAsync({ from: result.uri, to: dest });
        await Sharing.shareAsync(dest, {
          mimeType: "application/pdf",
          dialogTitle: "Exportar sessão",
        });
      }
    }
  }

  if (formats.csv) {
    const rows: string[][] = [
      ["Sessão", "Aluno", "Data", "Emissão"],
      [data.sessionTitle, data.studentName, data.sessionDate, emissao],
      [],
      ["Exercício", "Duração", "Nível de desenvolvimento", "Nível de ajuda"],
      ...data.executions.map((exec) => [
        exec.title,
        fmtDuration(exec.durationSeconds),
        fmtNivel(exec.nivelDesenvolvimento),
        fmtAjuda(exec.registroAjuda, exec.complementosAjuda),
      ]),
    ];

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
      a.download = `sessao_${safeName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const path = `${FileSystem.cacheDirectory}sessao_${safeName}.csv`;
      await FileSystem.writeAsStringAsync(path, csv);
      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Exportar sessão",
      });
    }
  }
}
