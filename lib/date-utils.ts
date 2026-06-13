/**
 * Parses a date string in local time, avoiding the UTC-offset pitfall of
 * `new Date("YYYY-MM-DD")` which JavaScript treats as UTC midnight.
 *
 * Accepts "YYYY-MM-DD" or full ISO strings (only the date part is used).
 * Returns null for falsy or unparseable input.
 */
export function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  const datePart = dateString.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

/**
 * Calculates age in full years at a reference date.
 *
 * Both dates are parsed in local time to avoid off-by-one errors on UTC
 * boundaries (e.g., UTC-3 would shift "YYYY-MM-DD" to the previous evening).
 *
 * @param birthDate - Birth date string ("YYYY-MM-DD" or ISO).
 * @param at        - Reference date string (default: today).
 * @returns Age in full years, or 0 when either date is invalid.
 */
export function calculateAge(
  birthDate: string | null,
  at?: string | null,
): number {
  const birth = parseLocalDate(birthDate ?? "");
  const ref = at ? parseLocalDate(at) : new Date();
  if (!birth || !ref) return 0;
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
