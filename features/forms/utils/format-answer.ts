/**
 * Formats a stored form answer (`respostas_formulario.valor_preenchido`) into a
 * human-readable string for display and export.
 *
 * @remarks
 * Yes/no answers are stored lowercase (`"sim"`/`"nao"`) and choice lists as a
 * JSON `{ selected, other }` object (legacy answers may be a plain JSON array).
 * Both shapes are normalized here: yes/no becomes "Sim"/"Não" and a choice list
 * becomes its selected options joined by ", " (a selected "Outro" is replaced by
 * its typed text). Empty answers return an en dash.
 *
 * @param valor - The raw stored value, or null/undefined when unanswered.
 * @returns The display string (e.g. "Sim", "Não", "Opção 1, Opção 2").
 */
export function formatAnswer(valor: string | null | undefined): string {
  if (valor == null || valor === "") return "–";

  const normalized = valor.trim().toLowerCase();
  if (normalized === "sim") return "Sim";
  if (normalized === "nao" || normalized === "não") return "Não";

  try {
    const parsed = JSON.parse(valor);

    if (Array.isArray(parsed)) {
      return parsed.length ? parsed.join(", ") : "–";
    }

    if (parsed && typeof parsed === "object" && "selected" in parsed) {
      const selected: unknown = (parsed as { selected: unknown }).selected;
      const other =
        typeof (parsed as { other?: unknown }).other === "string"
          ? (parsed as { other: string }).other
          : "";
      if (Array.isArray(selected)) {
        const parts = selected
          .map((opt) => (opt === "Outro" && other ? other : String(opt)))
          .filter((part) => part !== "");
        return parts.length ? parts.join(", ") : "–";
      }
      return selected != null && selected !== "" ? String(selected) : "–";
    }

    if (parsed == null) return "–";
    return String(parsed);
  } catch {
    return String(valor);
  }
}
