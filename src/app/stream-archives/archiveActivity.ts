import { parseVideoDurationSeconds } from "../lib/videoDuration";

export type DateRangeValue = [string | null, string | null];

export type ArchiveActivitySource = {
  stream_started_at: string;
  video_duration: string;
};

export type ArchiveActivitySummary = {
  dayActiveSeconds: Map<string, number>;
  dayStreamCounts: Map<string, number>;
  years: number[];
  maxActiveSeconds: number;
  totalActiveSeconds: number;
  latestYear: number | null;
};

export type ArchiveActivityDay = {
  dateKey: string;
  activeSeconds: number;
  streamCount: number;
};

export type ArchiveActivityMonthLabel = {
  month: number;
  weekIndex: number;
};

export type ArchiveActivityYear = {
  weeks: ArchiveActivityDay[][];
  monthLabels: ArchiveActivityMonthLabel[];
  totalActiveSeconds: number;
};

const JST_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getDaysInYear = (year: number) =>
  Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY_MS);

export const getJstDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = JST_DATE_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
};

export const toJstDateBoundaryMs = (dateValue: string, endOfDay = false) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const startOfJstDay = Date.UTC(year, month - 1, day, -9);

  return endOfDay ? startOfJstDay + DAY_MS - 1 : startOfJstDay;
};

export const getStreamStartedAtMs = (value: string) => {
  const startedAtMs = new Date(value).getTime();
  return Number.isNaN(startedAtMs) ? 0 : startedAtMs;
};

const addStreamActivityToDay = (
  dayActiveSeconds: Map<string, number>,
  dayStreamCounts: Map<string, number>,
  dateKey: string,
  activeSeconds: number,
) => {
  if (activeSeconds <= 0) {
    return;
  }

  dayActiveSeconds.set(
    dateKey,
    (dayActiveSeconds.get(dateKey) ?? 0) + activeSeconds,
  );
  dayStreamCounts.set(dateKey, (dayStreamCounts.get(dateKey) ?? 0) + 1);
};

export const isInStreamStartedDateRange = (
  streamStartedAtMs: number,
  [startDate, endDate]: DateRangeValue,
) => {
  if (!startDate && !endDate) {
    return true;
  }
  if (!streamStartedAtMs) {
    return false;
  }

  const startsAt = startDate ? toJstDateBoundaryMs(startDate) : null;
  const endsAt = endDate ? toJstDateBoundaryMs(endDate, true) : null;

  return (
    (!startsAt || streamStartedAtMs >= startsAt) &&
    (!endsAt || streamStartedAtMs <= endsAt)
  );
};

export const createArchiveActivitySummary = (
  items: ArchiveActivitySource[],
): ArchiveActivitySummary => {
  const dayActiveSeconds = new Map<string, number>();
  const dayStreamCounts = new Map<string, number>();
  let latestDateKey = "";

  items.forEach((item) => {
    const streamStartedAtMs = getStreamStartedAtMs(item.stream_started_at);
    const durationSeconds = parseVideoDurationSeconds(item.video_duration);
    if (!streamStartedAtMs || durationSeconds === null) {
      return;
    }

    const dateKey = getJstDateKey(item.stream_started_at);
    if (!dateKey) {
      return;
    }

    addStreamActivityToDay(
      dayActiveSeconds,
      dayStreamCounts,
      dateKey,
      durationSeconds,
    );

    if (dateKey > latestDateKey) {
      latestDateKey = dateKey;
    }
  });

  let maxActiveSeconds = 0;
  let totalActiveSeconds = 0;
  dayActiveSeconds.forEach((activeSeconds) => {
    maxActiveSeconds = Math.max(maxActiveSeconds, activeSeconds);
    totalActiveSeconds += activeSeconds;
  });

  const years = Array.from(
    new Set(
      Array.from(dayActiveSeconds.keys()).map((dateKey) =>
        Number(dateKey.slice(0, 4)),
      ),
    ),
  ).sort((a, b) => b - a);

  return {
    dayActiveSeconds,
    dayStreamCounts,
    years,
    maxActiveSeconds,
    totalActiveSeconds,
    latestYear: latestDateKey ? Number(latestDateKey.slice(0, 4)) : null,
  };
};

export const buildArchiveActivityYear = (
  summary: ArchiveActivitySummary,
  year: number,
): ArchiveActivityYear => {
  const daysInYear = getDaysInYear(year);
  const startDayOfWeek = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const cellCount = Math.ceil((startDayOfWeek + daysInYear) / 7) * 7;
  const weeks: ArchiveActivityDay[][] = [];
  const monthLabels: ArchiveActivityMonthLabel[] = [];
  let totalActiveSeconds = 0;

  for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
    const dayOffset = cellIndex - startDayOfWeek;
    const weekIndex = Math.floor(cellIndex / 7);
    const dayIndex = cellIndex % 7;

    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }

    if (dayOffset < 0 || dayOffset >= daysInYear) {
      weeks[weekIndex][dayIndex] = {
        dateKey: "",
        activeSeconds: 0,
        streamCount: 0,
      };
      continue;
    }

    const date = new Date(Date.UTC(year, 0, 1 + dayOffset));
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const dateKey = toDateKey(year, month, day);
    const activeSeconds = summary.dayActiveSeconds.get(dateKey) ?? 0;
    const streamCount = summary.dayStreamCounts.get(dateKey) ?? 0;

    if (day === 1) {
      monthLabels.push({ month, weekIndex });
    }
    totalActiveSeconds += activeSeconds;
    weeks[weekIndex][dayIndex] = { dateKey, activeSeconds, streamCount };
  }

  return {
    weeks,
    monthLabels,
    totalActiveSeconds,
  };
};

export const getArchiveActivityLevel = (
  activeSeconds: number,
  maxActiveSeconds: number,
) => {
  if (activeSeconds <= 0 || maxActiveSeconds <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil((activeSeconds / maxActiveSeconds) * 4));
};

export const formatActivityDuration = (seconds: number) => {
  if (seconds <= 0) {
    return "0m";
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }
  if (minutes <= 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};
