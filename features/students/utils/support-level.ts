/** A TEA support level as stored in `alunos.nivel_suporte`. */
export type SupportLevelCode = "nivel_1" | "nivel_2" | "nivel_3" | "indefinido";

/**
 * Maps the support level shown in the UI back to the code the database stores.
 *
 * @param label - Any support level wording the app produces: a picked option
 * ("Transtorno do Espectro Autista Nível 2"), a short display label
 * ("Nível 2", "Indefinido") or the stored code itself ("nivel_2").
 * @returns The matching code, or "indefinido" when no level can be identified.
 *
 * @remarks
 * The level is identified by its digit — the only part every wording shares,
 * in both locales and in the stored code. No wording of "Indefinido" carries a
 * digit, so it doubles as the fallback: an unknown or empty support level is
 * exactly an undefined one, and is now storable as such.
 */
export function toSupportLevelCode(label: string | null | undefined): SupportLevelCode {
  const text = label ?? "";
  if (text.includes("1")) return "nivel_1";
  if (text.includes("2")) return "nivel_2";
  if (text.includes("3")) return "nivel_3";
  return "indefinido";
}
