/**
 * Converts a hex color to an `rgba()` string with the given opacity.
 *
 * Accepts 3- or 6-digit hex (with or without a leading `#`).
 *
 * @param hex - Source hex color, e.g. `#fff` or `#ffffff`.
 * @param opacity - Alpha value between 0 and 1.
 * @returns The color as an `rgba(r, g, b, opacity)` string.
 */
export const withOpacity = (hex: string, opacity: number): string => {
  const cleanedHex = hex.replace("#", "");
  const normalizedHex = cleanedHex.length === 3
    ? cleanedHex.split("").map((char) => char + char).join("")
    : cleanedHex.slice(0, 6);
  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
