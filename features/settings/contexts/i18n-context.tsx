import React, { createContext, useCallback, useContext, useMemo } from "react";
import {
  Locale,
  TranslationKey,
  translations,
} from "../constants/translations";

/** The single locale the app currently ships in. */
const APP_LOCALE: Locale = "pt";

/** Value exposed by {@link I18nProvider}. */
type I18nContextValue = {
  /** The locale applied to the whole app. */
  locale: Locale;
  /** Translates a key for the active locale, falling back to pt then the key. */
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * Provides the app language and a `t()` translator.
 *
 * @remarks
 * The app is pinned to Portuguese ({@link APP_LOCALE}): the language selector
 * was removed from Settings, so neither the device language nor a previously
 * stored preference is consulted anymore — a user who had picked English is
 * brought back to Portuguese. The catalog keeps its pt **and** en entries, so
 * restoring the selector only takes reintroducing the preference state here.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const t = useCallback(
    (key: TranslationKey) =>
      translations[APP_LOCALE]?.[key] ?? translations.pt[key] ?? key,
    [],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale: APP_LOCALE, t }),
    [t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns the translator and locale state. Falls back to pt outside a provider. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "pt",
      t: (key) => translations.pt[key] ?? key,
    };
  }
  return ctx;
}
