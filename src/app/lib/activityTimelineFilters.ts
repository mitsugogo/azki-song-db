import type { ActivityTimelineItem } from "../hook/useActivityTimeline";

export type ActivityTimelineDisplayFilters = {
  includeShorts: boolean;
  includeArchives: boolean;
  includeSongUpdates: boolean;
  includeViewMilestones: boolean;
};

const isShortsText = (value: string | undefined) =>
  /[#＃]\s*shorts\b/i.test(value || "");

const isShortsSong = (
  item: Extract<ActivityTimelineItem, { kind: "song_update" }>,
) =>
  item.songs.some(
    (song) =>
      song.tags.some((tag) => tag.trim().toLowerCase() === "楽曲紹介shorts") ||
      isShortsText(song.video_title) ||
      isShortsText(song.title),
  );

const isShortsArchive = (
  item: Extract<ActivityTimelineItem, { kind: "archive" }>,
) =>
  [
    item.archive.title,
    item.archive.topic,
    item.archive.description,
    item.archive.timestamp_comment,
  ].some(isShortsText);

export function isShortsActivityItem(item: ActivityTimelineItem) {
  if (item.kind === "song_update") {
    return isShortsSong(item);
  }

  if (item.kind === "archive") {
    return isShortsArchive(item);
  }

  return false;
}

export function filterActivityTimelineItemsForDisplay(
  items: ActivityTimelineItem[],
  filters: ActivityTimelineDisplayFilters,
) {
  return items.filter((item) => {
    if (!filters.includeShorts && isShortsActivityItem(item)) {
      return false;
    }

    if (!filters.includeArchives && item.kind === "archive") {
      return false;
    }

    if (!filters.includeSongUpdates && item.kind === "song_update") {
      return false;
    }

    if (!filters.includeViewMilestones && item.kind === "view_milestone") {
      return false;
    }

    return true;
  });
}
