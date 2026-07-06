import { themePalettes, ThemeScheme } from "@/assets/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** User-selectable theme preference. "system" follows the device setting. */
export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "@baseaut/theme-mode";

/** Value exposed by {@link ThemeProvider}. */
type ThemeContextValue = {
  /** The stored preference ("system" | "light" | "dark"). */
  mode: ThemeMode;
  /** The scheme actually applied after resolving "system". */
  scheme: ThemeScheme;
  /** Resolved hex palette for inline `color={...}` usage. */
  colors: Record<string, string>;
  /** Persists and applies a new preference. */
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Provides the app theme (light/dark) with persistence. Drives NativeWind's
 * color scheme — which flips the CSS variables in `app/global.css` used by the
 * themed utility classes — and exposes the resolved hex palette for inline
 * styles via {@link useThemeColors}. Defaults to the device setting on first
 * launch.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
        setColorScheme(stored);
      }
    });
  }, [setColorScheme]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      setColorScheme(next);
      AsyncStorage.setItem(STORAGE_KEY, next);
    },
    [setColorScheme],
  );

  const scheme: ThemeScheme = colorScheme === "light" ? "light" : "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: themePalettes[scheme],
      setMode,
    }),
    [mode, scheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Returns the theme preference/state and the setter. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * Returns the resolved hex palette for the active theme, for inline
 * `color={...}` props, SVG fills and non-NativeWind styles. Falls back to the
 * dark palette when used outside a {@link ThemeProvider}.
 */
export function useThemeColors(): Record<string, string> {
  const ctx = useContext(ThemeContext);
  return ctx?.colors ?? themePalettes.dark;
}
