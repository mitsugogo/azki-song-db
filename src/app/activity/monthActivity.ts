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
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function isActivityMonthInRange(
  activityMonth: ActivityMonth,
  now = new Date(),
) {
  const monthIndex = toMonthIndex(activityMonth);
  return (
    monthIndex >=
      toMonthIndex({
        year: ACTIVITY_START_YEAR,
        month: ACTIVITY_START_MONTH,
      }) && monthIndex <= toMonthIndex(getCurrentActivityMonth(now))
  );
}

export function getAdjacentActivityMonth(
  activityMonth: ActivityMonth,
  delta: -1 | 1,
  now = new Date(),
) {
  const adjacent = fromMonthIndex(toMonthIndex(activityMonth) + delta);
  return isActivityMonthInRange(adjacent, now) ? adjacent : null;
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
