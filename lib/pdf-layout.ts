/**
 * Shared print layout for the app's generated PDFs.
 *
 * The core technique is a report table whose `<thead>` repeats on every printed
 * page (browsers/print engines re-render a table header group across page
 * breaks), so a section's identifying header — e.g. a student's data in a
 * consolidated report — stays visible on all of that section's pages. Each
 * content section sits in its own `<tbody>` and starts on a new page, and every
 * page gets proper `@page` margins.
 */

/**
 * Base stylesheet shared by every generated PDF: page margins, the repeating
 * running-header report table, and per-section page breaks. Both the legacy
 * (`page-break-*`) and modern (`break-*`) properties are set for print-engine
 * compatibility (Chromium on Android, WebKit on iOS).
 */
export const PDF_BASE_STYLE = `
  @page { margin: 16mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 22px; color: #0ea5e9; margin: 0 0 4px; }
  h2 { font-size: 16px; color: #334155; margin: 0 0 2px; }
  .meta { font-size: 11px; color: #94a3b8; margin: 0 0 12px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
  table { page-break-inside: avoid; break-inside: avoid; }
  svg { page-break-inside: avoid; break-inside: avoid; }
  table.pdf-report { width: 100%; border-collapse: collapse; }
  table.pdf-report > thead { display: table-header-group; }
  table.pdf-report > thead > tr > th { padding: 0 0 10px; border: 0; text-align: left; font-weight: normal; vertical-align: top; }
  table.pdf-report > tbody > tr > td { padding: 0; border: 0; vertical-align: top; }
  .pdf-runhead { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px; }
  .pdf-break { page-break-before: always; break-before: page; }
  table.pdf-report > tbody.pdf-break { page-break-before: always; break-before: page; }
`;

/**
 * Wraps content sections under a running header that repeats on every printed
 * page of the block.
 *
 * @param header - HTML placed in the table's `<thead>`; it repeats at the top of
 *   every page the block spans (e.g. the student's identifying data).
 * @param sections - Content sections; each one after the first starts on a new
 *   page. Empty entries are skipped.
 * @param options.breakBefore - When true, the whole block starts on a new page
 *   (used to separate students in a consolidated report).
 */
export function pdfRunningHeaderReport(
  header: string,
  sections: string[],
  options?: { breakBefore?: boolean },
): string {
  const bodies = sections
    .filter((s) => s && s.trim() !== "")
    .map(
      (s, i) =>
        `<tbody${i > 0 ? ' class="pdf-break"' : ""}><tr><td>${s}</td></tr></tbody>`,
    )
    .join("");
  return `<table class="pdf-report${options?.breakBefore ? " pdf-break" : ""}">
    <thead><tr><th><div class="pdf-runhead">${header}</div></th></tr></thead>
    ${bodies}
  </table>`;
}

/** Wraps body HTML in a complete printable document using {@link PDF_BASE_STYLE}. */
export function pdfDocument(bodyHtml: string, extraStyle = ""): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${PDF_BASE_STYLE}${extraStyle}</style></head><body>${bodyHtml}</body></html>`;
}
