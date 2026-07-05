"use client";

import { useMemo } from "react";
import useArchives from "./useArchives";
import useStatViewCounts from "./useStatViewCounts";
import type { MilestoneItem } from "./useMilestones";
import { getDiscographyLink } from "../lib/song";
import { buildWatchHref } from "../lib/watchUrl";
import type { ArchiveItem } from "../types/archiveItem";
import type { Period, ViewStat } from "../types/api/stat/views";
import type { EventItem } from "../types/eventItem";
import type { Song } from "../types/song";

export type ActivityTimelineKind =
  | "song_update"
  | "archive"
  | "view_milestone"
  | "milestone"
  | "event";

type BaseActivityTimelineItem = {
  id: string;
  kind: ActivityTimelineKind;
  occurredAt: string;
  href: string | undefined;
  titleHref?: string;
  youtubeHref?: string;
  videoId?: string;
};

export type SongUpdateActivityTimelineItem = BaseActivityTimelineItem & {
  kind: "song_update";
  href: string;
  youtubeHref: string;
  videoId: string;
  count: number;
  songs: Song[];
  videoTitle: string;
};

export type ArchiveActivityTimelineItem = BaseActivityTimelineItem & {
  kind: "archive";
  href: string;
  youtubeHref: string;
  archive: ArchiveItem;
  videoId: string;
};

export type ViewMilestoneActivityTimelineItem = BaseActivityTimelineItem & {
  kind: "view_milestone";
  href: string;
  youtubeHref: string;
  song: Song;
  videoId: string;
  targetCount: number;
  currentViewCount: number;
};

export type MilestoneActivityTimelineItem = BaseActivityTimelineItem & {
  kind: "milestone";
  milestone: MilestoneItem;
};

export type EventActivityTimelineItem = BaseActivityTimelineItem & {
  kind: "event";
  event: EventItem;
};

export type ActivityTimelineItem =
  | SongUpdateActivityTimelineItem
  | ArchiveActivityTimelineItem
  | ViewMilestoneActivityTimelineItem
  | MilestoneActivityTimelineItem
  | EventActivityTimelineItem;

type UseActivityTimelineOptions = {
  songs: Song[];
  events?: EventItem[];
  milestones?: MilestoneItem[];
  isSongsLoading?: boolean;
  isEventsLoading?: boolean;
  isMilestonesLoading?: boolean;
  enabled?: boolean;
  limit?: number;
  songUpdateLimit?: number;
  archiveLimit?: number;
  viewMilestoneCandidateLimit?: number;
  viewMilestonePeriod?: Period;
  dateRange?: ActivityTimelineDateRange;
};

export type ActivityTimelineDateRange = {
  start: Date;
  endExclusive: Date;
};

const DEFAULT_ACTIVITY_LIMIT = 20;
const DEFAULT_SONG_UPDATE_LIMIT = 8;
const DEFAULT_ARCHIVE_LIMIT = 8;
const DEFAULT_VIEW_MILESTONE_CANDIDATE_LIMIT = Number.POSITIVE_INFINITY;
const FIRST_VIEW_MILESTONE_TARGET = 500000;
const MILLION_VIEW_MILESTONE_STEP = 1000000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getDateTime(value: string | number | Date | null | undefined) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function toIsoDate(value: string | number | Date | null | undefined) {
  const timestamp = getDateTime(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function toDisplayedViewMilestoneDate(
  value: string | number | Date | null | undefined,
) {
  const timestamp = getDateTime(value);
  return Number.isFinite(timestamp) ? new Date(timestamp - DAY_MS) : null;
}

function getArchiveHref(videoId: string) {
  return `/stream-archives#${encodeURIComponent(`archive-${videoId}`)}`;
}

function getYouTubeHref(videoId: string, videoUrl?: string) {
  const trimmedVideoUrl = videoUrl?.trim();

  if (trimmedVideoUrl) {
    return trimmedVideoUrl;
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function buildSongUpdateItems(
  songs: Song[],
  limit: number,
): SongUpdateActivityTimelineItem[] {
  const groupedByVideoId = new Map<string, Song[]>();

  songs.forEach((song) => {
    if (!song.video_id || !song.broadcast_at) {
      return;
    }

    const group = groupedByVideoId.get(song.video_id) ?? [];
    group.push(song);
    groupedByVideoId.set(song.video_id, group);
  });

  return Array.from(groupedByVideoId.entries())
    .map(([videoId, groupedSongs]) => {
      const occurredAt = toIsoDate(
        Math.max(...groupedSongs.map((song) => getDateTime(song.broadcast_at))),
      );

      if (!occurredAt) {
        return null;
      }

      const representative = groupedSongs[0];

      return {
        id: `song-update-${videoId}-${occurredAt}`,
        kind: "song_update" as const,
        occurredAt,
        href: buildWatchHref({ videoId }),
        youtubeHref: getYouTubeHref(videoId, representative.video_uri),
        videoId,
        count: groupedSongs.length,
        songs: groupedSongs,
        videoTitle: representative.video_title || representative.title,
      };
    })
    .filter((item): item is SongUpdateActivityTimelineItem => Boolean(item))
    .sort((a, b) => getDateTime(b.occurredAt) - getDateTime(a.occurredAt))
    .slice(0, limit);
}

function buildArchiveItems(
  archives: ArchiveItem[],
  limit: number,
): ArchiveActivityTimelineItem[] {
  return archives
    .map((archive) => {
      const occurredAt = toIsoDate(
        archive.stream_started_at || archive.published_at,
      );

      if (!occurredAt || !archive.video_id) {
        return null;
      }

      return {
        id: `archive-${archive.video_id}-${occurredAt}`,
        kind: "archive" as const,
        occurredAt,
        href: getArchiveHref(archive.video_id),
        youtubeHref: getYouTubeHref(archive.video_id, archive.video_url),
        videoId: archive.video_id,
        archive,
      };
    })
    .filter((item): item is ArchiveActivityTimelineItem => Boolean(item))
    .sort((a, b) => getDateTime(b.occurredAt) - getDateTime(a.occurredAt))
    .slice(0, limit);
}

function buildMilestoneItems(
  milestones: MilestoneItem[],
): MilestoneActivityTimelineItem[] {
  return milestones
    .map((milestone, index) => {
      const occurredAt = toIsoDate(milestone.date);

      if (!occurredAt || !milestone.content) {
        return null;
      }

      return {
        id: `milestone-${milestone.date}-${milestone.content}-${index}`,
        kind: "milestone" as const,
        occurredAt,
        href: milestone.url || undefined,
        milestone,
      };
    })
    .filter((item): item is MilestoneActivityTimelineItem => Boolean(item));
}

function buildEventItems(events: EventItem[]): EventActivityTimelineItem[] {
  return events
    .map((event, index) => {
      const occurredAt = toIsoDate(event.start_at);

      if (!occurredAt || !event.content) {
        return null;
      }

      return {
        id: `event-${event.start_at}-${event.content}-${index}`,
        kind: "event" as const,
        occurredAt,
        href: event.url || undefined,
        event,
      };
    })
    .filter((item): item is EventActivityTimelineItem => Boolean(item));
}

function buildMilestoneCandidateVideoIds(
  songs: Song[],
  candidateLimit: number,
) {
  const songsByVideoId = new Map<string, Song>();

  songs.forEach((song) => {
    if (!song.video_id) {
      return;
    }

    const existing = songsByVideoId.get(song.video_id);
    const currentViewCount = Number(song.view_count ?? 0);
    const existingViewCount = Number(existing?.view_count ?? 0);

    if (!existing || currentViewCount > existingViewCount) {
      songsByVideoId.set(song.video_id, song);
    }
  });

  const candidates = Array.from(songsByVideoId.values());
  const highValueCandidates = [...candidates].sort(
    (a, b) => Number(b.view_count ?? 0) - Number(a.view_count ?? 0),
  );
  const recentCandidates = [...candidates].sort(
    (a, b) => getDateTime(b.broadcast_at) - getDateTime(a.broadcast_at),
  );
  const orderedVideoIds: string[] = [];
  const seenVideoIds = new Set<string>();

  [...highValueCandidates, ...recentCandidates].forEach((song) => {
    if (
      orderedVideoIds.length >= candidateLimit ||
      seenVideoIds.has(song.video_id)
    ) {
      return;
    }

    orderedVideoIds.push(song.video_id);
    seenVideoIds.add(song.video_id);
  });

  return orderedVideoIds;
}

function getCrossedViewMilestoneTargets(
  previousViewCount: number,
  currentViewCount: number,
) {
  if (currentViewCount < FIRST_VIEW_MILESTONE_TARGET) {
    return [];
  }

  const targets: number[] = [];
  const normalizedPrevious = Math.max(0, previousViewCount);

  if (
    normalizedPrevious < FIRST_VIEW_MILESTONE_TARGET &&
    currentViewCount >= FIRST_VIEW_MILESTONE_TARGET
  ) {
    targets.push(FIRST_VIEW_MILESTONE_TARGET);
  }

  const firstMillionTarget = Math.max(
    MILLION_VIEW_MILESTONE_STEP,
    Math.floor(normalizedPrevious / MILLION_VIEW_MILESTONE_STEP) *
      MILLION_VIEW_MILESTONE_STEP +
      MILLION_VIEW_MILESTONE_STEP,
  );

  for (
    let target = firstMillionTarget;
    target <= currentViewCount;
    target += MILLION_VIEW_MILESTONE_STEP
  ) {
    targets.push(target);
  }

  return targets;
}

function buildViewMilestoneItemsForVideo(
  videoId: string,
  song: Song,
  history: ViewStat[],
): ViewMilestoneActivityTimelineItem[] {
  const sortedHistory = [...history]
    .filter((item) => item?.datetime)
    .sort((a, b) => getDateTime(a.datetime) - getDateTime(b.datetime));
  const latestHistoryViewCount = sortedHistory.at(-1)?.viewCount ?? 0;
  const currentViewCount =
    Number(song.view_count ?? 0) || latestHistoryViewCount;
  const seenTargets = new Set<number>();
  const items: ViewMilestoneActivityTimelineItem[] = [];

  for (let index = 1; index < sortedHistory.length; index += 1) {
    const previous = sortedHistory[index - 1];
    const current = sortedHistory[index];
    const currentOccurredAt = toIsoDate(
      toDisplayedViewMilestoneDate(current.datetime),
    );

    if (!currentOccurredAt) {
      continue;
    }

    const crossedTargets = getCrossedViewMilestoneTargets(
      previous.viewCount ?? 0,
      current.viewCount ?? 0,
    );

    crossedTargets.forEach((targetCount) => {
      if (seenTargets.has(targetCount)) {
        return;
      }

      items.push({
        id: `view-milestone-${videoId}-${targetCount}`,
        kind: "view_milestone" as const,
        occurredAt: currentOccurredAt,
        href: buildWatchHref({ videoId, start: song.start }),
        titleHref:
          getDiscographyLink(song) ??
          buildWatchHref({ videoId, start: song.start }),
        youtubeHref: getYouTubeHref(videoId, song.video_uri),
        videoId,
        song,
        targetCount,
        currentViewCount,
      });
      seenTargets.add(targetCount);
    });
  }

  return items;
}

export function buildViewMilestoneItems(
  songs: Song[],
  viewStatisticsByVideoId: Record<string, ViewStat[]>,
): ViewMilestoneActivityTimelineItem[] {
  const songsByVideoId = new Map<string, Song>();

  songs.forEach((song) => {
    if (!song.video_id) {
      return;
    }

    const existing = songsByVideoId.get(song.video_id);
    const currentViewCount = Number(song.view_count ?? 0);
    const existingViewCount = Number(existing?.view_count ?? 0);

    if (!existing || currentViewCount > existingViewCount) {
      songsByVideoId.set(song.video_id, song);
    }
  });

  return Array.from(Object.entries(viewStatisticsByVideoId)).flatMap(
    ([videoId, history]) => {
      const song = songsByVideoId.get(videoId);

      if (!song) {
        return [];
      }

      return buildViewMilestoneItemsForVideo(videoId, song, history);
    },
  );
}

export function filterActivityTimelineItems(
  items: ActivityTimelineItem[],
  options: {
    dateRange?: ActivityTimelineDateRange;
    now?: number;
  } = {},
) {
  const now = options.now ?? Date.now();
  const rangeStart = options.dateRange
    ? getDateTime(options.dateRange.start)
    : Number.NEGATIVE_INFINITY;
  const rangeEndExclusive = options.dateRange
    ? getDateTime(options.dateRange.endExclusive)
    : Number.POSITIVE_INFINITY;

  return items
    .filter((item) => {
      const occurredAt = getDateTime(item.occurredAt);
      return (
        occurredAt <= now &&
        occurredAt >= rangeStart &&
        occurredAt < rangeEndExclusive
      );
    })
    .sort((a, b) => getDateTime(b.occurredAt) - getDateTime(a.occurredAt));
}

export default function useActivityTimeline({
  songs,
  events = [],
  milestones = [],
  isSongsLoading = false,
  isEventsLoading = false,
  isMilestonesLoading = false,
  enabled = true,
  limit = DEFAULT_ACTIVITY_LIMIT,
  songUpdateLimit = DEFAULT_SONG_UPDATE_LIMIT,
  archiveLimit = DEFAULT_ARCHIVE_LIMIT,
  viewMilestoneCandidateLimit = DEFAULT_VIEW_MILESTONE_CANDIDATE_LIMIT,
  viewMilestonePeriod = "30d",
  dateRange,
}: UseActivityTimelineOptions) {
  const { items: archives, isLoading: isArchivesLoading } = useArchives();
  const milestoneVideoIds = useMemo(
    () => buildMilestoneCandidateVideoIds(songs, viewMilestoneCandidateLimit),
    [songs, viewMilestoneCandidateLimit],
  );
  const { data: viewStatisticsByVideoId, loading: isViewMilestonesLoading } =
    useStatViewCounts(milestoneVideoIds, viewMilestonePeriod, enabled);

  const items = useMemo(() => {
    const now = Date.now();
    const effectiveSongUpdateLimit = dateRange
      ? Number.POSITIVE_INFINITY
      : songUpdateLimit;
    const effectiveArchiveLimit = dateRange
      ? Number.POSITIVE_INFINITY
      : archiveLimit;
    const songUpdateItems = buildSongUpdateItems(
      songs,
      effectiveSongUpdateLimit,
    );
    const archiveItems = buildArchiveItems(archives, effectiveArchiveLimit);
    const milestoneItems = buildMilestoneItems(milestones);
    const eventItems = buildEventItems(events);
    const viewMilestoneItems = enabled
      ? buildViewMilestoneItems(songs, viewStatisticsByVideoId)
      : [];

    const combinedItems = [
      ...songUpdateItems,
      ...archiveItems,
      ...viewMilestoneItems,
      ...milestoneItems,
      ...eventItems,
    ];

    return filterActivityTimelineItems(combinedItems, {
      dateRange,
      now,
    }).slice(0, limit);
  }, [
    archiveLimit,
    archives,
    dateRange,
    enabled,
    events,
    limit,
    milestones,
    songUpdateLimit,
    songs,
    viewStatisticsByVideoId,
  ]);

  return {
    items,
    isLoading:
      isSongsLoading ||
      isArchivesLoading ||
      isEventsLoading ||
      isMilestonesLoading,
    isViewMilestonesLoading: enabled && isViewMilestonesLoading,
  };
}
