import type { AnniversaryItem } from "../types/anniversaryItem";
import {
  computeNextIsoForAnniversary,
  formatAnniversaryNameForYear,
  getDaysUntil,
  jstOffsetMs,
} from "../lib/highlights";

export type AnniversaryRow = {
  id: string;
  item: AnniversaryItem;
  name: string;
  nextIso: string;
  nextDate: string;
  firstDate: string;
  monthDay: string;
  monthKey: string;
  monthLabel: string;
  daysUntil: number | null;
};

export type AnniversaryMonthGroup = {
  key: string;
  label: string;
  rows: AnniversaryRow[];
};

export function buildAnniversaryPresentation(
  items: AnniversaryItem[],
  locale: string,
  nowMs: number,
) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: locale.startsWith("ja") ? "long" : "short",
    day: "numeric",
  });
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
  });
  const rows: AnniversaryRow[] = items.map((item, index) => {
    const nextIso = computeNextIsoForAnniversary(item, nowMs);
    const nextDate = nextIso ? new Date(nextIso) : null;
    const nextJst = nextDate
      ? new Date(nextDate.getTime() + jstOffsetMs)
      : null;
    const year = nextJst?.getUTCFullYear();
    const month = nextJst ? nextJst.getUTCMonth() + 1 : null;
    const day = nextJst?.getUTCDate();
    const firstDate = new Date(item.first_date_at);

    return {
      id: `anniversary-${index}`,
      item,
      name: year ? formatAnniversaryNameForYear(item, locale, year) : item.name,
      nextIso,
      nextDate: nextDate ? dateFormatter.format(nextDate) : "",
      firstDate: Number.isFinite(firstDate.getTime())
        ? dateFormatter.format(firstDate)
        : "",
      monthDay:
        month && day
          ? `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`
          : "",
      monthKey:
        year && month ? `${year}-${String(month).padStart(2, "0")}` : "undated",
      monthLabel: nextDate ? monthFormatter.format(nextDate) : "",
      daysUntil: nextIso ? getDaysUntil(nextIso, nowMs) : null,
    };
  });
  rows.sort(
    (a, b) =>
      (a.daysUntil ?? Infinity) - (b.daysUntil ?? Infinity) ||
      a.name.localeCompare(b.name, locale),
  );

  const groups: AnniversaryMonthGroup[] = [];
  for (const row of rows) {
    let group = groups[groups.length - 1];
    if (!group || group.key !== row.monthKey) {
      group = { key: row.monthKey, label: row.monthLabel, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  const first = rows[0];
  const featured =
    first?.daysUntil != null
      ? rows.filter((row) => row.daysUntil === first.daysUntil)
      : [];

  return { groups, featured };
}
