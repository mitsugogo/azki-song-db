import { getActivityJstDateKey } from "../lib/activityCalendar";

export const ACTIVITY_START_YEAR = 2018;
export const ACTIVITY_START_MONTH = 11;

export type ActivityMonth = {
  year: number;
  month: number;
};

export function padMonth(month: number) {
  return String(month).padStart(2, "0");
}

export function getActivityMonthHref({ year, month }: ActivityMonth) {
  return `/activity/${year}/${padMonth(month)}`;
}

export function toMonthIndex({ year, month }: ActivityMonth) {
  return year * 12 + (month - 1);
}

export function fromMonthIndex(index: number): ActivityMonth {
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function getCurrentActivityMonth(now = new Date()): ActivityMonth {
  const [year, month] = getActivityJstDateKey(now).split("-").map(Number);
  return {
    year,
    month,
  };
}

export function getLatestActivityMonth(
  dates: Array<string | Date>,
  now = new Date(),
): ActivityMonth {
  const latestDateKey = dates.reduce<string>((latest, date) => {
    const dateKey = getActivityJstDateKey(date);
    return dateKey > latest ? dateKey : latest;
  }, getActivityJstDateKey(now));
  const [year, month] = latestDateKey.split("-").map(Number);
  return { year, month };
}

export function isActivityMonthInRange(activityMonth: ActivityMonth) {
  const monthIndex = toMonthIndex(activityMonth);
  return (
    Number.isInteger(activityMonth.year) &&
    activityMonth.year <= 9999 &&
    Number.isInteger(activityMonth.month) &&
    activityMonth.month >= 1 &&
    activityMonth.month <= 12 &&
    monthIndex >=
      toMonthIndex({
        year: ACTIVITY_START_YEAR,
        month: ACTIVITY_START_MONTH,
      })
  );
}

export function getAdjacentActivityMonth(
  activityMonth: ActivityMonth,
  delta: -1 | 1,
) {
  const adjacent = fromMonthIndex(toMonthIndex(activityMonth) + delta);
  return isActivityMonthInRange(adjacent) ? adjacent : null;
}

export function formatActivityMonthLabel(
  activityMonth: ActivityMonth,
  locale: string,
) {
  const date = new Date(activityMonth.year, activityMonth.month - 1, 1);
  return new Intl.DateTimeFormat(locale.startsWith("ja") ? "ja-JP" : locale, {
    year: "numeric",
    month: "long",
  }).format(date);
}
