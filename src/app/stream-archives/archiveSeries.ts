import { formatDate } from "../lib/formatDate";
import { parseVideoDurationSeconds } from "../lib/videoDuration";
import type { ArchiveItem } from "../types/archiveItem";
import { getStreamStartedAtMs } from "./archiveActivity";
import { normalizeArchiveSeriesKey } from "./archiveSearch";

type IndexedSeriesFields = {
  seriesKey?: string;
  seriesTitle?: string;
  streamStartedAtMs?: number;
  videoDurationSeconds?: number;
};

export type ArchiveSeriesGroup<T extends ArchiveItem = ArchiveItem> = {
  key: string;
  title: string;
  items: T[];
  totalDurationSeconds: number;
  latestItem: T;
  latestStreamStartedAt: string;
  latestStreamStartedAtMs: number;
};

const getSeriesTitle = <T extends ArchiveItem>(
  item: T & IndexedSeriesFields,
  uncategorizedLabel: string,
) => item.seriesTitle || item.topic || uncategorizedLabel;

const getSeriesKey = <T extends ArchiveItem>(
  item: T & IndexedSeriesFields,
  title: string,
) => item.seriesKey || normalizeArchiveSeriesKey(title) || "other";

const getStartedAtMs = <T extends ArchiveItem>(item: T & IndexedSeriesFields) =>
  item.streamStartedAtMs ?? getStreamStartedAtMs(item.stream_started_at);

const getDurationSeconds = <T extends ArchiveItem>(
  item: T & IndexedSeriesFields,
) =>
  item.videoDurationSeconds ??
  parseVideoDurationSeconds(item.video_duration) ??
  0;

export const createArchiveSeriesGroups = <T extends ArchiveItem>(
  items: T[],
  uncategorizedLabel = "その他",
): ArchiveSeriesGroup<T>[] => {
  const groups = new Map<string, ArchiveSeriesGroup<T>>();

  items.forEach((sourceItem) => {
    const item = sourceItem as T & IndexedSeriesFields;
    const title = getSeriesTitle(item, uncategorizedLabel);
    const key = getSeriesKey(item, title);
    const streamStartedAtMs = getStartedAtMs(item);
    const durationSeconds = getDurationSeconds(item);
    const group = groups.get(key);

    if (group) {
      group.items.push(sourceItem);
      group.totalDurationSeconds += durationSeconds;
      if (streamStartedAtMs > group.latestStreamStartedAtMs) {
        group.latestItem = sourceItem;
        group.latestStreamStartedAt = sourceItem.stream_started_at;
        group.latestStreamStartedAtMs = streamStartedAtMs;
      }
      return;
    }

    groups.set(key, {
      key,
      title,
      items: [sourceItem],
      totalDurationSeconds: durationSeconds,
      latestItem: sourceItem,
      latestStreamStartedAt: sourceItem.stream_started_at,
      latestStreamStartedAtMs: streamStartedAtMs,
    });
  });

  return Array.from(groups.values());
};

export const formatArchiveDate = (value: string, locale: string) => {
  if (!value) {
    return "-";
  }

  return formatDate(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};

export const formatArchiveSeriesDuration = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};
