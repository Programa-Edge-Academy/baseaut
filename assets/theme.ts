/**
 * Theme palettes for light and dark modes.
 *
 * @remarks
 * The dark palette is intentionally identical to the historical {@link colors}
 * values in `assets/colors.ts`, so dark mode (the previous default) renders
 * exactly as before. NativeWind utility classes read these tokens through the
 * CSS variables declared in `app/global.css`; inline `color={...}` usages can
 * read the resolved hex map via `useThemeColors`.
 */

/** Resolved color scheme. */
export type ThemeScheme = "light" | "dark";

/** Chart/protocol accent colors that stay fixed across themes. */
export const chartColors = {
  verbal: "#09CDDB",
  example: "#DBBF09",
  physical: "#DC0886",
  mabc1: "#ff6430",
  mabc2: "#00c900",
  mabc3: "#3a41c7",
};

/** Hex palette per scheme, used by inline styles via {@link useThemeColors}. */
export const themePalettes: Record<ThemeScheme, Record<string, string>> = {
  dark: {
    primary: "#0E89E5",
    secondary: "#25C125",
    extra: "#F0BD02",
    error: "#BE2223",
    level1: "#14181F",
    level2: "#1B1F27",
    outline: "#2B303B",
    muted: "#66758A",
    placeholder: "#465460",
    content: "#FFFFFF",
    contentInverse: "#14181F",
    ...chartColors,
  },
  light: {
    primary: "#0E89E5",
    secondary: "#1FA81F",
    extra: "#C9930A",
    error: "#BE2223",
    level1: "#F5F7FA",
    level2: "#FFFFFF",
    outline: "#D6DCE4",
    muted: "#5A6675",
    placeholder: "#96A0AC",
    content: "#14181F",
    contentInverse: "#FFFFFF",
    ...chartColors,
  },
};
