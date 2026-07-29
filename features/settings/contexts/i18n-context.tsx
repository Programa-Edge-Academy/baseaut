import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NativeModules, Platform } from "react-native";
import {
  Locale,
  TranslationKey,
  translations,
} from "../constants/translations";

/** User-selectable language preference. "system" follows the device language. */
export type LocalePreference = "system" | Locale;

const STORAGE_KEY = "@baseaut/locale";

/** Value exposed by {@link I18nProvider}. */
type I18nContextValue = {
  /** The stored preference ("system" | "pt" | "en" | "es"). */
  preference: LocalePreference;
  /** The locale actually applied after resolving "system". */
  locale: Locale;
  /** Translates a key for the active locale, falling back to pt then the key. */
  t: (key: TranslationKey) => string;
  /** Persists and applies a new language preference. */
  setPreference: (preference: LocalePreference) => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/** Reads the device language (e.g. "pt", "en", "es") across platforms. */
function getDeviceLocale(): Locale {
  let tag = "pt";
  try {
    if (Platform.OS === "ios") {
      tag =
        NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        "pt";
    } else if (Platform.OS === "android") {
      tag = NativeModules.I18nManager?.localeIdentifier ?? "pt";
    } else if (typeof navigator !== "undefined") {
      tag = navigator.language ?? "pt";
    }
  } catch {
    tag = "pt";
  }
  const lang = tag.slice(0, 2).toLowerCase();
  if (lang === "en") return "en";
  return "pt";
}

/**
 * Provides the app language with persistence and a `t()` translator. Defaults
 * to the device language on first launch, resolving "system" against
 * {@link getDeviceLocale}.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "system" || stored === "pt" || stored === "en") {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = useCallback((next: LocalePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const locale: Locale = preference === "system" ? getDeviceLocale() : preference;

  const t = useCallback(
    (key: TranslationKey) =>
      translations[locale]?.[key] ?? translations.pt[key] ?? key,
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ preference, locale, t, setPreference }),
    [preference, locale, t, setPreference],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns the translator and locale state. Falls back to pt outside a provider. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      preference: "system",
      locale: "pt",
      t: (key) => translations.pt[key] ?? key,
      setPreference: () => {},
    };
  }
  return ctx;
}
