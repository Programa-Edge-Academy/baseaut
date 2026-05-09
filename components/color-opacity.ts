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
