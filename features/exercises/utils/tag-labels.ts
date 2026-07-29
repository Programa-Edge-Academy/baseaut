import { TranslationKey } from "@/features/settings/constants/translations";

/**
 * Maps a stored exercise tag value (Portuguese, also the DB value) to its
 * translation key. Values not in the map render as-is.
 */
const TAG_KEYS: Record<string, TranslationKey> = {
  "Coordenação": "tags.coordenacao",
  "Força": "tags.forca",
  "Equilíbrio": "tags.equilibrio",
};

/** Maps a stored subtag value to its translation key. */
const SUBTAG_KEYS: Record<string, TranslationKey> = {
  locomotor: "subtags.locomotor",
  manipulativo: "subtags.manipulativo",
  estabilizador: "subtags.estabilizador",
};

/**
 * Translates a stored tag value for display, keeping the underlying value
 * unchanged. Falls back to the raw value when it is not a known tag.
 */
export function translateTag(value: string, t: (key: TranslationKey) => string): string {
  const key = TAG_KEYS[value];
  return key ? t(key) : value;
}

/**
 * Translates a stored subtag value for display, keeping the underlying value
 * unchanged. Falls back to the capitalized raw value when unknown.
 */
export function translateSubtag(value: string, t: (key: TranslationKey) => string): string {
  const key = SUBTAG_KEYS[value];
  if (key) return t(key);
  return value.charAt(0).toUpperCase() + value.slice(1);
}
