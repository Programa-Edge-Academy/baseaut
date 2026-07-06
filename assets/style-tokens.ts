/**
 * Shared, reusable className strings for recurring UI patterns.
 *
 * @remarks
 * Centralizes NativeWind class combinations that were previously duplicated
 * across screens and modals (cards, overlays, primary buttons, field inputs).
 * Prefer composing these tokens over re-hardcoding the same class strings, so a
 * visual change lands in one place. All tokens use themed color classes
 * (bg-level1/level2, border-outline, text-content, …) so they follow the
 * active light/dark theme.
 */
export const styleTokens = {
  /** Full-screen dimmed overlay used behind centered modals. */
  modalOverlay: "flex-1 bg-black/60 justify-center items-center px-6",
  /** Bottom-sheet dimmed overlay. */
  sheetOverlay: "flex-1 bg-black/60 justify-end",
  /** Standard elevated card (level2 surface, outline border, rounded). */
  card: "rounded-2xl border border-outline bg-level2 p-5",
  /** Inset surface card (level1 surface), e.g. selectable rows. */
  insetCard: "rounded-2xl border border-outline bg-level1 p-4",
  /** Section title text style. */
  sectionTitle: "text-header-3 text-content",
  /** Muted helper/subtitle text style. */
  helperText: "text-default-2 text-muted",
  /** Field label above inputs. */
  fieldLabel: "text-default-2 text-muted",
} as const;
