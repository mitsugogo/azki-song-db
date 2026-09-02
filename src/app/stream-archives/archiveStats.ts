import type { ArchiveParticipantEntry } from "../lib/archiveParticipants";
import { parseVideoDurationSeconds } from "../lib/videoDuration";
import type { ArchiveItem } from "../types/archiveItem";
import {
  createArchiveActivitySummary,
  type ArchiveActivitySummary,
} from "./archiveActivity";
import { normalizeArchiveSeriesKey } from "./archiveSearch";

export type ArchiveStatsItem = ArchiveItem & {
  participantEntries: ArchiveParticipantEntry[];
};

export type ArchiveCategoryStats = {
  name: string;
  key: string;
  streamCount: number;
  totalDurationSeconds: number;
};

export type ArchiveCalendarDayStats = {
  dateKey: string;
  streamCount: number;
  totalDurationSeconds: number;
  items: ArchiveStatsItem[];
};

export type ArchiveTimeHeatmapCell = {
  weekday: number;
  startHour: number;
  streamCount: number;
};

export type ArchiveStatsSummary = {
  items: ArchiveStatsItem[];
  streamCount: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  categories: ArchiveCategoryStats[];
  calendarDays: Map<string, ArchiveCalendarDayStats>;
  latestMonth: string | null;
  activity: ArchiveActivitySummary;
  timeHeatmap: ArchiveTimeHeatmapCell[];
  maxTimeHeatmapCount: number;
};

const JST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

export const isShortsArchive = (item: ArchiveItem) =>
  /[#＃]\s*shorts/i.test(
    [item.title, item.topic, item.description, item.timestamp_comment].join(
      "\n",
    ),
  );

const getJstDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = JST_DATE_TIME_FORMATTER.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  if (!year || !month || !day || !Number.isFinite(hour)) {
    return null;
  }

  return {
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    startHour: Math.floor(hour / 2) * 2,
  };
};

export const createArchiveStatsSummary = (
  sourceItems: ArchiveStatsItem[],
  locale: string,
  options: {
    categoryLimit?: number;
    uncategorizedLabel?: string;
    year?: number;
  } = {},
): ArchiveStatsSummary => {
  const { categoryLimit = 10, uncategorizedLabel = "その他", year } = options;
  const items = sourceItems.filter((item) => {
    if (isShortsArchive(item)) {
      return false;
    }
    if (!year) {
      return true;
    }

    return getJstDateTime(item.stream_started_at)?.dateKey.startsWith(
      `${year}-`,
    );
  });
  const categoriesByKey = new Map<string, ArchiveCategoryStats>();
  const calendarDays = new Map<string, ArchiveCalendarDayStats>();
  const timeCounts = new Map<string, number>();
  let totalDurationSeconds = 0;
  let itemsWithDuration = 0;
  let latestDateKey = "";

  items.forEach((item) => {
    const durationSeconds = parseVideoDurationSeconds(item.video_duration) ?? 0;
    if (durationSeconds > 0) {
      totalDurationSeconds += durationSeconds;
      itemsWithDuration += 1;
    }

    const categoryName = item.topic.trim() || uncategorizedLabel;
    const categoryKey = normalizeArchiveSeriesKey(categoryName);
    const category = categoriesByKey.get(categoryKey);
    categoriesByKey.set(categoryKey, {
      name: category?.name ?? categoryName,
      key: categoryKey,
      streamCount: (category?.streamCount ?? 0) + 1,
      totalDurationSeconds:
        (category?.totalDurationSeconds ?? 0) + durationSeconds,
    });

    const dateTime = getJstDateTime(item.stream_started_at);
    if (!dateTime) {
      return;
    }

    const day = calendarDays.get(dateTime.dateKey);
    calendarDays.set(dateTime.dateKey, {
      dateKey: dateTime.dateKey,
      streamCount: (day?.streamCount ?? 0) + 1,
      totalDurationSeconds: (day?.totalDurationSeconds ?? 0) + durationSeconds,
      items: [...(day?.items ?? []), item],
    });
    if (dateTime.dateKey > latestDateKey) {
      latestDateKey = dateTime.dateKey;
    }

    const timeKey = `${dateTime.weekday}-${dateTime.startHour}`;
    timeCounts.set(timeKey, (timeCounts.get(timeKey) ?? 0) + 1);
  });

  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: "base",
  });
  const categories = Array.from(categoriesByKey.values())
    .sort(
      (left, right) =>
        right.streamCount - left.streamCount ||
        collator.compare(left.name, right.name),
    )
    .slice(0, categoryLimit);
  const timeHeatmap: ArchiveTimeHeatmapCell[] = [];
  let maxTimeHeatmapCount = 0;
  for (let startHour = 0; startHour < 24; startHour += 2) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const streamCount = timeCounts.get(`${weekday}-${startHour}`) ?? 0;
      maxTimeHeatmapCount = Math.max(maxTimeHeatmapCount, streamCount);
      timeHeatmap.push({ weekday, startHour, streamCount });
    }
  }

  return {
    items,
    streamCount: items.length,
    totalDurationSeconds,
    averageDurationSeconds:
      itemsWithDuration > 0 ? totalDurationSeconds / itemsWithDuration : 0,
    categories,
    calendarDays,
    latestMonth: latestDateKey ? latestDateKey.slice(0, 7) : null,
    activity: createArchiveActivitySummary(items),
    timeHeatmap,
    maxTimeHeatmapCount,
  };
};
