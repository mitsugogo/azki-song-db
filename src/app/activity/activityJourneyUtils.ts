const DAY_MS = 24 * 60 * 60 * 1000;

export const ACTIVITY_DEBUT_DATE = "2018-11-15";

export type ActivityDuration = {
  years: number;
  months: number;
  days: number;
};

export type ActivityJourneyStats = {
  today: string;
  activityDays: number;
  duration: ActivityDuration;
};

export function dateKeyToUtc(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getJstDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export function getActivityJourneyStats(
  now: Date = new Date(),
): ActivityJourneyStats {
  const today = getJstDateKey(now);
  const [startYear, startMonth, startDay] =
    ACTIVITY_DEBUT_DATE.split("-").map(Number);
  const [year, month, day] = today.split("-").map(Number);

  let years = year - startYear;
  let months = month - startMonth;
  let days = day - startDay;

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    today,
    activityDays:
      Math.floor(
        (dateKeyToUtc(today) - dateKeyToUtc(ACTIVITY_DEBUT_DATE)) / DAY_MS,
      ) + 1,
    duration: { years, months, days },
  };
}

export function getJourneyPosition(dateKey: string, today: string) {
  const start = dateKeyToUtc(ACTIVITY_DEBUT_DATE);
  const end = Math.max(start + DAY_MS, dateKeyToUtc(today));
  const target = dateKeyToUtc(dateKey);

  return Math.min(100, Math.max(0, ((target - start) / (end - start)) * 100));
}

export function formatJourneyDate(dateKey: string) {
  return dateKey.replaceAll("-", ".");
}
