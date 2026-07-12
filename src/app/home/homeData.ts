import { isOriginalSong } from "../config/filters";
import { siteConfig } from "../config/siteConfig";
import type { ChannelEntry } from "../types/api/yt/channels";
import type { Song } from "../types/song";

const HERO_BACKGROUND_RECENT_DAYS = 30;
const HERO_BACKGROUND_RECENT_WEIGHT = 10;

export type RecentUpdate = {
  date: string;
  videoId: string;
  videoTitle: string;
  songs: Song[];
  count: number;
};

export type SingerAvatar = {
  name: string;
  iconUrl: string;
  channelUrl: string | null;
};

export function pickRecommendedSongs(items: Song[], count: number) {
  if (items.length <= count) {
    return items;
  }

  const pool = items.filter((item) =>
    item.sing.includes(siteConfig.talentName),
  );
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
}

export function pickHeroBackgroundSong(items: Song[]) {
  const candidates = items.filter(
    (song) =>
      song.video_id &&
      song.tags.some((tag) => tag.includes("MV")) &&
      isOriginalSong(song),
  );

  if (candidates.length === 0) {
    return null;
  }

  const recentThreshold =
    Date.now() - HERO_BACKGROUND_RECENT_DAYS * 24 * 60 * 60 * 1000;
  const weightedCandidates = candidates.map((song) => {
    const broadcastTime = new Date(song.broadcast_at).getTime();
    const isRecent =
      Number.isFinite(broadcastTime) && broadcastTime >= recentThreshold;

    return {
      song,
      weight: isRecent ? HERO_BACKGROUND_RECENT_WEIGHT : 1,
    };
  });
  const totalWeight = weightedCandidates.reduce(
    (sum, candidate) => sum + candidate.weight,
    0,
  );
  let randomWeight = Math.random() * totalWeight;

  for (const candidate of weightedCandidates) {
    randomWeight -= candidate.weight;
    if (randomWeight < 0) {
      return candidate.song;
    }
  }

  return weightedCandidates.at(-1)?.song ?? null;
}

export function buildHeroBackgroundVideoUrl(song: Song) {
  const fallbackUrl = `https://www.youtube.com/watch?v=${song.video_id}`;
  const baseVideoUrl = song.video_uri || fallbackUrl;

  if (Number(song.start) <= 0) {
    return baseVideoUrl;
  }

  const separator = baseVideoUrl.includes("?") ? "&" : "?";
  return `${baseVideoUrl}${separator}`;
}

export function groupRecentUpdates(
  items: Song[],
  limit: number = 3,
): RecentUpdate[] {
  const grouped = new Map<string, Song[]>();

  for (const song of items) {
    if (!song.broadcast_at || !song.video_id) {
      continue;
    }
    const songs = grouped.get(song.video_id);
    if (songs) {
      songs.push(song);
    } else {
      grouped.set(song.video_id, [song]);
    }
  }

  return Array.from(grouped.entries())
    .map(([videoId, songs]) => {
      const latestDate = new Date(
        Math.max(...songs.map((song) => new Date(song.broadcast_at).getTime())),
      );

      return {
        date: latestDate.toISOString(),
        videoId,
        videoTitle: songs[0].video_title,
        songs,
        count: songs.length,
        latestDate,
      };
    })
    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
    .slice(0, limit)
    .map(({ latestDate: _latestDate, ...update }) => update);
}

function getSingerNames(song: Song) {
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

export function buildSingerAvatarsByVideoId(
  recentUpdates: RecentUpdate[],
  channels: ChannelEntry[],
) {
  const channelsBySingerName = new Map<string, ChannelEntry>();
  for (const entry of channels) {
    const artistName = (entry.artistName ?? "").trim();
    if (artistName && !channelsBySingerName.has(artistName)) {
      channelsBySingerName.set(artistName, entry);
    }

    const channelName = (entry.channelName ?? "").trim();
    if (channelName && !channelsBySingerName.has(channelName)) {
      channelsBySingerName.set(channelName, entry);
    }
  }

  const avatarsByVideoId = new Map<string, SingerAvatar[]>();
  for (const update of recentUpdates) {
    const avatars: SingerAvatar[] = [];
    const seenChannels = new Set<string>();

    for (const song of update.songs) {
      for (const singerName of getSingerNames(song)) {
        const entry = channelsBySingerName.get(singerName);
        const iconUrl = (entry?.iconUrl ?? "").trim();
        if (!iconUrl) {
          continue;
        }

        const channelUrl = entry ? buildChannelUrl(entry) : null;
        const channelKey =
          (entry?.youtubeId ?? "").trim() ||
          channelUrl ||
          (entry?.channelName ?? "").trim() ||
          iconUrl;
        if (seenChannels.has(channelKey)) {
          continue;
        }

        avatars.push({
          name: entry?.channelName || entry?.artistName || singerName,
          iconUrl,
          channelUrl,
        });
        seenChannels.add(channelKey);
      }
    }

    avatarsByVideoId.set(update.videoId, avatars);
  }

  return avatarsByVideoId;
}
