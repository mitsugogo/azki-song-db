export const SEICHI_MAP_USER_COUNT_HEADER = "X-Seichi-Map-User-Count";

export function parseSeichiMapUserCount(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;

  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}
