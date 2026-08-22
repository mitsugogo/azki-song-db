import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import type { ActivityMonth } from "../activity/monthActivity";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type ActivityCalendarDay = {
  dateKey: string;
  day: number;
};

export type ActivityCalendarArchiveItem = Extract<
  ActivityTimelineItem,
  { kind: "archive" }
>;

export type ActivityCalendarCellPreview = {
  thumbnailItems: ActivityCalendarArchiveItem[];
  textItems: ActivityTimelineItem[];
  remainingCount: number;
};

export function getActivityJstDateKey(
  value: string | number | Date | null | undefined,
) {
  if (!value) {
    return "";
  }

  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const date = new Date(timestamp + JST_OFFSET_MS);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function buildActivityCalendarDays({
  year,
  month,
}: ActivityMonth): Array<ActivityCalendarDay | null> {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days: Array<ActivityCalendarDay | null> = Array.from(
    { length: firstWeekday },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
    });
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function groupActivityItemsByJstDate(items: ActivityTimelineItem[]) {
  const groupedItems = new Map<string, ActivityTimelineItem[]>();

  items.forEach((item) => {
    const dateKey = getActivityJstDateKey(item.occurredAt);
    if (!dateKey) {
      return;
    }

    const dayItems = groupedItems.get(dateKey);
    if (dayItems) {
      dayItems.push(item);
    } else {
      groupedItems.set(dateKey, [item]);
    }
  });

  return groupedItems;
}

export function getActivityCalendarCellPreview(
  items: ActivityTimelineItem[],
  itemLimit = 3,
  thumbnailLimit = 2,
): ActivityCalendarCellPreview {
  const resolvedItemLimit = Math.max(0, itemLimit);
  const resolvedThumbnailLimit = Math.min(
    resolvedItemLimit,
    Math.max(0, thumbnailLimit),
  );
  const thumbnailItems = items
    .filter(
      (item): item is ActivityCalendarArchiveItem => item.kind === "archive",
    )
    .slice(0, resolvedThumbnailLimit);
  const thumbnailItemIds = new Set(thumbnailItems.map((item) => item.id));
  const textItems = items
    .filter((item) => !thumbnailItemIds.has(item.id))
    .slice(0, resolvedItemLimit - thumbnailItems.length);

  return {
    thumbnailItems,
    textItems,
    remainingCount: Math.max(
      0,
      items.length - thumbnailItems.length - textItems.length,
    ),
  };
}

export function getInitialActivityCalendarDateKey(
  activityMonth: ActivityMonth,
  groupedItems: Map<string, ActivityTimelineItem[]>,
  now = new Date(),
) {
  const todayKey = getActivityJstDateKey(now);
  const monthPrefix = `${activityMonth.year}-${String(activityMonth.month).padStart(2, "0")}-`;

  if (todayKey.startsWith(monthPrefix) && groupedItems.has(todayKey)) {
    return todayKey;
  }

  return (
    buildActivityCalendarDays(activityMonth).find(
      (day) => day && groupedItems.has(day.dateKey),
    )?.dateKey ?? null
  );
}
