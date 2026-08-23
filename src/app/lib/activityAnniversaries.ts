import type { ActivityMonth } from "../activity/monthActivity";
import type { AnniversaryActivityTimelineItem } from "../hook/useActivityTimeline";
import type { AnniversaryItem } from "../types/anniversaryItem";
import {
  formatAnniversaryNameForYear,
  getAnniversaryNumberForYear,
} from "./highlights";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function parseAnniversaryMonthDay(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return { month, day };
}

function buildJstOccurrenceIso(year: number, month: number, day: number) {
  const utcMs = Date.UTC(year, month - 1, day) - JST_OFFSET_MS;
  const jstDate = new Date(utcMs + JST_OFFSET_MS);

  if (
    jstDate.getUTCFullYear() !== year ||
    jstDate.getUTCMonth() + 1 !== month ||
    jstDate.getUTCDate() !== day
  ) {
    return null;
  }

  return new Date(utcMs).toISOString();
}

export function buildAnniversaryActivityItems(
  anniversaries: AnniversaryItem[],
  activityMonth: ActivityMonth,
  locale: string,
): AnniversaryActivityTimelineItem[] {
  return anniversaries.flatMap((anniversary, index) => {
    const monthDay = parseAnniversaryMonthDay(anniversary.date || "");
    if (!monthDay || monthDay.month !== activityMonth.month) {
      return [];
    }

    const occurredAt = buildJstOccurrenceIso(
      activityMonth.year,
      monthDay.month,
      monthDay.day,
    );
    if (!occurredAt) {
      return [];
    }

    const firstDateTime = anniversary.first_date_at
      ? new Date(anniversary.first_date_at).getTime()
      : null;
    if (
      firstDateTime !== null &&
      (!Number.isFinite(firstDateTime) ||
        new Date(occurredAt).getTime() < firstDateTime)
    ) {
      return [];
    }

    if (anniversary.name.includes("{n}")) {
      const anniversaryNumber = getAnniversaryNumberForYear(
        anniversary,
        activityMonth.year,
      );
      if (anniversaryNumber === null || anniversaryNumber <= 0) {
        return [];
      }
    }

    const displayName = formatAnniversaryNameForYear(
      anniversary,
      locale,
      activityMonth.year,
    );
    if (!displayName) {
      return [];
    }

    return [
      {
        id: `anniversary-${activityMonth.year}-${monthDay.month}-${monthDay.day}-${index}`,
        kind: "anniversary" as const,
        occurredAt,
        href: anniversary.url.trim() || "/anniversaries",
        anniversary,
        displayName,
        importance: "high" as const,
      },
    ];
  });
}
