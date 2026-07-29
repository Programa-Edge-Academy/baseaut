import type { Locale } from "@/features/settings/constants/translations";
import { localizeFormText } from "@/features/forms/utils/form-content-i18n";

/**
 * Formats a stored form answer (`respostas_formulario.valor_preenchido`) into a
 * human-readable string for display and export, localized to `locale`.
 *
 * @remarks
 * Yes/no answers are stored lowercase (`"sim"`/`"nao"`) and choice lists as a
 * JSON `{ selected, other }` object (legacy answers may be a plain JSON array).
 * Both shapes are normalized here: yes/no becomes "Sim"/"Não" (localized) and a
 * choice list becomes its selected options joined by ", " (a selected "Outro" is
 * replaced by its typed text, which is kept verbatim). Canonical option values
 * are localized for display; the stored value is never changed. Empty answers
 * return an en dash.
 *
 * @param valor - The raw stored value, or null/undefined when unanswered.
 * @param locale - The active locale used to localize canonical values.
 * @returns The display string (e.g. "Yes", "No", "Option 1, Option 2").
 */
export function formatAnswer(
  valor: string | null | undefined,
  locale: Locale = "pt",
): string {
  if (valor == null || valor === "") return "–";

  const normalized = valor.trim().toLowerCase();
  if (normalized === "sim") return localizeFormText("Sim", locale);
  if (normalized === "nao" || normalized === "não") return localizeFormText("Não", locale);

  try {
    const parsed = JSON.parse(valor);

    if (Array.isArray(parsed)) {
      return parsed.length
        ? parsed.map((opt) => localizeFormText(String(opt), locale)).join(", ")
        : "–";
    }

    if (parsed && typeof parsed === "object" && "selected" in parsed) {
      const selected: unknown = (parsed as { selected: unknown }).selected;
      const other =
        typeof (parsed as { other?: unknown }).other === "string"
          ? (parsed as { other: string }).other
          : "";
      if (Array.isArray(selected)) {
        const parts = selected
          .map((opt) => (opt === "Outro" && other ? other : localizeFormText(String(opt), locale)))
          .filter((part) => part !== "");
        return parts.length ? parts.join(", ") : "–";
      }
      return selected != null && selected !== "" ? localizeFormText(String(selected), locale) : "–";
    }

    if (parsed == null) return "–";
    return String(parsed);
  } catch {
    return String(valor);
  }
}
