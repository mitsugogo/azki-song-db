import type { useTranslations } from "next-intl";
import type { ActivityTimelineItem } from "../hook/useActivityTimeline";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";

type ActivityTranslator = ReturnType<typeof useTranslations>;

export type ActivitySingerPresentation = {
  name: string;
  iconUrl: string;
  channelUrl: string | null;
};

export type ActivityChannelPresentation = {
  name: string;
  iconUrl: string;
  channelUrl: string | null;
};

export type ActivityItemPresentation = {
  badge: string;
  timelineTitle: string;
  timelineDescription: string;
  detailTitle: string;
  detailDescription: string;
  titleHref: string | undefined;
  timelineDescriptionHref: string | undefined;
  youtubeHref: string | undefined;
  placeHref: string | undefined;
  placeLabel: string;
  archiveChannel: ActivityChannelPresentation | null;
  singers: ActivitySingerPresentation[];
};

export type ActivityChannelIndexes = {
  bySingerName: Map<string, ChannelEntry>;
  byYoutubeId: Map<string, ChannelEntry>;
};

function formatActivityMilestoneCount(value: number, locale: string) {
  if (locale.startsWith("ja") && value >= 10000) {
    return `${Math.floor(value / 10000)}万`;
  }

  return new Intl.NumberFormat(locale, {
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function buildChannelUrl(entry: ChannelEntry) {
  if (entry.youtubeId) {
    return `https://www.youtube.com/channel/${entry.youtubeId}`;
  }

  const handle = (entry.handle ?? "").trim();
  if (!handle) {
    return null;
  }

  return `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`;
}

function getSingerNamesFromSong(song: Song) {
  const localizedSings = song.hl?.ja?.sings ?? [];
  if (localizedSings.length > 0) {
    return localizedSings.map((name) => name.trim()).filter(Boolean);
  }

  if (song.sings.length > 0) {
    return song.sings.map((name) => name.trim()).filter(Boolean);
  }

  return song.sing
    .split(/[、,]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function buildActivityChannelIndexes(
  channels: ChannelEntry[],
): ActivityChannelIndexes {
  const bySingerName = new Map<string, ChannelEntry>();
  const byYoutubeId = new Map<string, ChannelEntry>();

  channels.forEach((entry) => {
    const artistName = (entry.artistName ?? "").trim();
    if (artistName && !bySingerName.has(artistName)) {
      bySingerName.set(artistName, entry);
    }

    const channelName = (entry.channelName ?? "").trim();
    if (channelName && !bySingerName.has(channelName)) {
      bySingerName.set(channelName, entry);
    }

    const youtubeId = (entry.youtubeId ?? "").trim();
    if (youtubeId && !byYoutubeId.has(youtubeId)) {
      byYoutubeId.set(youtubeId, entry);
    }
  });

  return { bySingerName, byYoutubeId };
}

export function getActivityItemLabel(
  item: ActivityTimelineItem,
  t: ActivityTranslator,
  locale: string,
) {
  if (item.kind === "song_update") {
    return {
      badge: t("activitySongUpdateBadge"),
      title: t("activitySongUpdateDescription", { count: item.count }),
      description: item.videoTitle || item.songs[0]?.title || "",
    };
  }

  if (item.kind === "archive") {
    return {
      badge: t("activityArchiveBadge"),
      title: t("activityArchiveTitle"),
      description: item.archive.title,
    };
  }

  if (item.kind === "milestone") {
    return {
      badge: t("activityMilestoneBadge"),
      title: item.milestone.content,
      description: item.milestone.note || "",
    };
  }

  if (item.kind === "event") {
    return {
      badge: t("activityEventBadge"),
      title: item.event.content,
      description: item.event.note || "",
    };
  }

  if (item.kind === "anniversary") {
    return {
      badge: t("activityAnniversaryBadge"),
      title: item.displayName,
      description: item.anniversary.note || "",
    };
  }

  return {
    badge: t("activityViewMilestoneBadge"),
    title: t("activityViewMilestoneTitle", {
      title: item.song.title,
      count: formatActivityMilestoneCount(item.targetCount, locale),
    }),
    description: item.song.video_title || item.song.title,
  };
}

function getActivityPlace(item: ActivityTimelineItem) {
  if (item.kind === "milestone") {
    return {
      label: item.milestone.place || "",
      href: item.milestone.place_url || undefined,
    };
  }

  if (item.kind === "event") {
    return {
      label: item.event.place || "",
      href: item.event.place_url || undefined,
    };
  }

  return { label: "", href: undefined };
}

function getArchiveChannel(
  item: ActivityTimelineItem,
  indexes: ActivityChannelIndexes,
): ActivityChannelPresentation | null {
  if (item.kind !== "archive") {
    return null;
  }

  const channelId = item.archive.channel_id.trim();
  if (!channelId) {
    return null;
  }

  const channel = indexes.byYoutubeId.get(channelId);
  const name =
    channel?.channelName?.trim() || channel?.artistName?.trim() || channelId;

  return {
    name,
    iconUrl: channel?.iconUrl?.trim() || "",
    channelUrl: channel
      ? buildChannelUrl(channel)
      : `https://www.youtube.com/channel/${channelId}`,
  };
}

function getActivitySingers(
  item: ActivityTimelineItem,
  indexes: ActivityChannelIndexes,
) {
  const songs =
    item.kind === "song_update"
      ? item.songs
      : item.kind === "view_milestone"
        ? [item.song]
        : [];

  const singers: ActivitySingerPresentation[] = [];
  const seenChannels = new Set<string>();

  songs.forEach((song) => {
    getSingerNamesFromSong(song).forEach((singerName) => {
      const channel = indexes.bySingerName.get(singerName);
      const iconUrl = channel?.iconUrl?.trim() || "";
      if (!iconUrl) {
        return;
      }

      const channelUrl = channel ? buildChannelUrl(channel) : null;
      const channelKey =
        channel?.youtubeId?.trim() ||
        channelUrl ||
        channel?.channelName?.trim() ||
        iconUrl;
      if (seenChannels.has(channelKey)) {
        return;
      }

      singers.push({
        name: channel?.channelName || channel?.artistName || singerName,
        iconUrl,
        channelUrl,
      });
      seenChannels.add(channelKey);
    });
  });

  return singers;
}

export function buildActivityItemPresentation(
  item: ActivityTimelineItem,
  t: ActivityTranslator,
  locale: string,
  indexes: ActivityChannelIndexes,
): ActivityItemPresentation {
  const label = getActivityItemLabel(item, t, locale);
  const place = getActivityPlace(item);
  const timelineDescriptionHref =
    item.kind === "archive" ||
    item.kind === "view_milestone" ||
    item.kind === "song_update"
      ? item.youtubeHref
      : undefined;
  const detailTitle =
    item.kind === "archive" || item.kind === "song_update"
      ? label.description || label.title
      : label.title;
  const detailDescription =
    item.kind === "archive"
      ? item.archive.description || ""
      : label.description;

  return {
    badge: label.badge,
    timelineTitle: label.title,
    timelineDescription: label.description,
    detailTitle,
    detailDescription:
      detailDescription === detailTitle ? "" : detailDescription,
    titleHref: item.titleHref ?? item.href,
    timelineDescriptionHref,
    youtubeHref: item.youtubeHref,
    placeHref: place.href,
    placeLabel: place.label,
    archiveChannel: getArchiveChannel(item, indexes),
    singers: getActivitySingers(item, indexes),
  };
}
