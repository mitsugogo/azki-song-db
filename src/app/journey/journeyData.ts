import {
  buildActivityMilestones,
  type ActivityTimelineMilestone,
} from "@/app/activity/activityMilestones";
import { isOriginalSong } from "@/app/config/filters";
import { siteConfig } from "@/app/config/siteConfig";
import { ROUTE_RANGES } from "@/app/config/timelineRoutes";
import { normalizeSongTitle } from "@/app/discography/utils/normalizeSongTitle";
import type { MilestoneItem } from "@/app/hook/useMilestones";
import {
  getSongPlayCountKey,
  type SongPlayCountState,
} from "@/app/hook/useSongPlayCounts";
import type { PlaylistEntry } from "@/app/lib/playlistUrl";
import type { ArchiveItem } from "@/app/types/archiveItem";
import type { Song } from "@/app/types/song";

export type JourneyMomentKind = "milestone" | "archive";

export type JourneyMoment = {
  id: string;
  kind: JourneyMomentKind;
  occurredAt: string;
  title: string;
  detail?: string;
  href?: string;
  featured?: boolean;
  prominent?: boolean;
  media?: {
    videoId: string;
    title: string;
    href: string;
  };
};

export type JourneyDay = {
  dateKey: string;
  occurredAt: string;
  moments: JourneyMoment[];
};

export type JourneyChapter = {
  id: string;
  labelKey?: string;
  fallbackLabel: string;
  from: string;
  to: string | null;
  songs: Song[];
  representativeSongs: Song[];
  moments: JourneyMoment[];
  counts: {
    songs: number;
    archives: number;
    videos: number;
    milestones: number;
  };
  personal: {
    plays: number;
    favorites: number;
  };
};

type JourneyDataInput = {
  songs: Song[];
  archives: ArchiveItem[];
  milestones: MilestoneItem[];
  playCountState: SongPlayCountState;
  favorites: PlaylistEntry[];
  videoTitlesById?: Record<string, string>;
  now?: Date;
};

type OriginalReleaseGroup = {
  key: string;
  releasedAt: string;
  representative: Song;
  variants: Song[];
};

const ARCHIVE_EXCLUDED_PATTERN =
  /#shorts|short\s*ver|talk\s*&\s*live|切り抜き|振り返り|直前|注意事項|AZKi生放送|耐久AZKi|シン・タイキュウアズキ|雑談|ドライブ|超難問|モノマネ|同時視聴|感想/i;
const ARCHIVE_LIVE_PATTERN = /\b(?:3d\s*)?live\b|ライブ/i;
const ARCHIVE_PROJECT_PATTERN = /企画|project|プロジェクト|大会|耐久/i;
const FEATURED_MILESTONE_PATTERN =
  /^(?:\d{4}年生誕|活動\d+周年|活動\d+ヶ月記念|初オリ曲MV|初めてのASMR配信|かなけん 最初で最後の 3DLIVE を開催|AS_tar結成|終電駅名ASMR（中央線ASMR）配信|\d{2,3}万人達成|「ぺこあずクッキング」で初のオフコラボ|AZロケ.*|あずいろ3周年|AS_tar新曲「Going My Way」リリース|#AZKi初配信 （エイプリルフール企画）|KoZMy結成|AZKi SOLO LiVE 2025 "Departure"|「Virtual Diva AZKi」としてYouTube活動開始|100万人達成|メジャーデビューEP「3枚目の地図」リリース|オリジナルソング「equal」リリース|瀬名航さんとのコラボEP「恋の宅配便」リリース|3rdビジュお披露目|床|「すばるあずきみずしーの3コードミラクル」開始|初作詞の「from A to Z」リリース|ホロぐら初登場|ホロライブ移籍(?:（ホロライブ0期生）)?|初めてのGeoGuessr配信|「かなけん」入社|開拓者の姿が明かされる|あずいろ結成|初のロケ動画(?:「AZKi's LOCATION!!」公開)?)$/;

export const JOURNEY_PROMINENT_MILESTONE_PATTERN =
  /^(?:「Virtual Diva AZKi」としてYouTube活動開始|京王電鉄コラボ|初めてのGeoGuessr配信|.*年生誕|活動.*周年|AZKi Major Debut LiVE「声音エントロピー」.*|AZKi SOLO LiVE 2025 "Departure"|#AZKi初配信 （エイプリルフール企画）|初のロケ動画「AZKi's LOCATION!!」公開|ビクターエンターテインメントからメジャーデビュー|100万人達成)$/;

const getArchiveSearchableText = (archive: ArchiveItem) =>
  `${archive.topic} ${archive.title}`
    .replace(/ホロライブ/gi, "")
    .replace(/hololive/gi, "");

const toTimestamp = (value: string | Date | null | undefined) => {
  if (!value) return Number.NaN;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
};

const toJourneyDateKey = (value: string | Date) => {
  const timestamp = toTimestamp(value);
  if (!Number.isFinite(timestamp)) return String(value);
  return new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

export const isFeaturedJourneyMilestoneTitle = (title: string) =>
  FEATURED_MILESTONE_PATTERN.test(title);

export const isProminentJourneyMilestoneTitle = (title: string) =>
  JOURNEY_PROMINENT_MILESTONE_PATTERN.test(title);

export const getJourneyYouTubeVideoId = (url: string | undefined) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|live\/|shorts\/))([^?&#/]+)/i,
  );
  return match?.[1] ?? null;
};

export function groupJourneyMomentsByDate(
  moments: JourneyMoment[],
): JourneyDay[] {
  const days = new Map<string, JourneyDay>();

  moments.forEach((moment) => {
    const dateKey = toJourneyDateKey(moment.occurredAt);
    const existing = days.get(dateKey);
    if (existing) {
      existing.moments.push(moment);
      return;
    }
    days.set(dateKey, {
      dateKey,
      occurredAt: moment.occurredAt,
      moments: [moment],
    });
  });

  return [...days.values()];
}

const isWithinRange = (
  value: string | Date | null | undefined,
  from: string,
  to: string | null,
  now: Date,
) => {
  const timestamp = toTimestamp(value);
  if (!Number.isFinite(timestamp) || timestamp > now.getTime()) return false;

  const fromTimestamp = toTimestamp(`${from}T00:00:00+09:00`);
  const toTimestampValue = to
    ? toTimestamp(`${to}T23:59:59.999+09:00`)
    : Number.POSITIVE_INFINITY;

  return timestamp >= fromTimestamp && timestamp <= toTimestampValue;
};

const getOriginalReleaseKey = (song: Song) =>
  `${normalizeSongTitle(song.title, song.artist).normalize("NFKC").trim().toLowerCase()}\0${song.artist.normalize("NFKC").trim().toLowerCase()}`;

const pickOriginalReleaseRepresentative = (songs: Song[]) =>
  [...songs].sort((left, right) => {
    const leftIsMv = left.tags.includes("オリ曲MV") ? 1 : 0;
    const rightIsMv = right.tags.includes("オリ曲MV") ? 1 : 0;
    if (leftIsMv !== rightIsMv) return rightIsMv - leftIsMv;

    const viewDifference =
      Number(right.view_count ?? 0) - Number(left.view_count ?? 0);
    if (viewDifference !== 0) return viewDifference;

    return toTimestamp(left.broadcast_at) - toTimestamp(right.broadcast_at);
  })[0];

const buildOriginalReleaseGroups = (songs: Song[], now: Date) => {
  const groups = new Map<string, Song[]>();

  songs.forEach((song) => {
    if (!isOriginalSong(song)) return;
    const releasedAt = toTimestamp(song.broadcast_at);
    if (!Number.isFinite(releasedAt) || releasedAt > now.getTime()) return;

    const key = getOriginalReleaseKey(song);
    const group = groups.get(key) ?? [];
    group.push(song);
    groups.set(key, group);
  });

  return [...groups.entries()].map(([key, variants]) => {
    const releasedAt = [...variants]
      .map((song) => song.broadcast_at)
      .filter((value) => Number.isFinite(toTimestamp(value)))
      .sort((left, right) => toTimestamp(left) - toTimestamp(right))[0];

    return {
      key,
      releasedAt,
      representative: pickOriginalReleaseRepresentative(variants),
      variants,
    } satisfies OriginalReleaseGroup;
  });
};

const pickRepresentativeSongs = (
  releases: OriginalReleaseGroup[],
  limit = 3,
) => {
  const candidates = releases
    .filter((release) => release.representative.video_id)
    .sort(
      (left, right) =>
        toTimestamp(left.releasedAt) - toTimestamp(right.releasedAt),
    );
  if (candidates.length <= limit) {
    return candidates.map((release) => release.representative);
  }

  return Array.from({ length: limit }, (_, index) => {
    const start = Math.floor((index * candidates.length) / limit);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) * candidates.length) / limit),
    );
    const segment = candidates.slice(start, end);
    return segment.reduce((best, current) =>
      Number(current.representative.view_count ?? 0) >
      Number(best.representative.view_count ?? 0)
        ? current
        : best,
    ).representative;
  });
};

const isSupplementalArchive = (archive: ArchiveItem) => {
  const searchable = getArchiveSearchableText(archive);
  return (
    !ARCHIVE_EXCLUDED_PATTERN.test(searchable) &&
    (ARCHIVE_LIVE_PATTERN.test(searchable) ||
      ARCHIVE_PROJECT_PATTERN.test(searchable))
  );
};

const buildSupplementalArchives = (archives: ArchiveItem[], now: Date) => {
  const firstProjectByTopic = new Set<string>();

  return [...archives]
    .filter((archive) => {
      const occurredAt = archive.stream_started_at || archive.published_at;
      const timestamp = toTimestamp(occurredAt);
      return (
        Number.isFinite(timestamp) &&
        timestamp <= now.getTime() &&
        isSupplementalArchive(archive)
      );
    })
    .sort(
      (left, right) =>
        toTimestamp(left.stream_started_at || left.published_at) -
        toTimestamp(right.stream_started_at || right.published_at),
    )
    .filter((archive) => {
      const searchable = getArchiveSearchableText(archive);
      if (ARCHIVE_LIVE_PATTERN.test(searchable)) return true;

      const topicKey = archive.topic.normalize("NFKC").trim().toLowerCase();
      const projectKey = topicKey || archive.title.normalize("NFKC").trim();
      if (firstProjectByTopic.has(projectKey)) return false;
      firstProjectByTopic.add(projectKey);
      return true;
    });
};

const buildMoments = ({
  activityMilestones,
  mediaArchives,
  songs,
  videoTitlesById,
}: {
  activityMilestones: ActivityTimelineMilestone[];
  mediaArchives: ArchiveItem[];
  songs: Song[];
  videoTitlesById: Record<string, string>;
}) => {
  const milestoneMoments: JourneyMoment[] = activityMilestones.map(
    (milestone, index) => {
      const featured = isFeaturedJourneyMilestoneTitle(milestone.text);
      const milestoneSong = featured
        ? songs.find(
            (song) => song.video_id && song.milestones.includes(milestone.text),
          )
        : undefined;
      const linkedVideoId = getJourneyYouTubeVideoId(milestone.url);
      const linkedArchive = linkedVideoId
        ? mediaArchives.find((archive) => archive.video_id === linkedVideoId)
        : undefined;
      const milestoneDateKey = toJourneyDateKey(milestone.date);
      const sameDayArchive = featured
        ? mediaArchives.find(
            (archive) =>
              archive.video_id &&
              toJourneyDateKey(
                archive.stream_started_at || archive.published_at,
              ) === milestoneDateKey,
          )
        : undefined;
      const sameDaySong = featured
        ? songs.find(
            (song) =>
              song.video_id &&
              toJourneyDateKey(song.broadcast_at) === milestoneDateKey,
          )
        : undefined;
      const transferArchive = milestone.text.startsWith("ホロライブ移籍")
        ? mediaArchives.find((archive) =>
            archive.title.includes("ホロライブへ移籍しました"),
          )
        : undefined;
      const featuredVideo = milestoneSong
        ? {
            videoId: milestoneSong.video_id,
            title: milestoneSong.video_title || milestoneSong.title,
          }
        : linkedVideoId
          ? {
              videoId: linkedVideoId,
              title:
                linkedArchive?.title ||
                videoTitlesById[linkedVideoId] ||
                milestone.text,
            }
          : sameDayArchive
            ? {
                videoId: sameDayArchive.video_id,
                title: sameDayArchive.title,
              }
            : sameDaySong
              ? {
                  videoId: sameDaySong.video_id,
                  title: sameDaySong.video_title || sameDaySong.title,
                }
              : transferArchive
                ? {
                    videoId: transferArchive.video_id,
                    title: transferArchive.title,
                  }
                : undefined;

      return {
        id: `milestone-${milestone.date.toISOString()}-${index}`,
        kind: "milestone",
        occurredAt: milestone.date.toISOString(),
        title: milestone.text,
        detail: milestone.place || milestone.note || undefined,
        href: milestone.url || undefined,
        featured,
        prominent: isProminentJourneyMilestoneTitle(milestone.text),
        media:
          featured && featuredVideo
            ? {
                ...featuredVideo,
                href: `https://www.youtube.com/watch?v=${featuredVideo.videoId}`,
              }
            : undefined,
      } satisfies JourneyMoment;
    },
  );

  return milestoneMoments
    .sort(
      (left, right) =>
        toTimestamp(left.occurredAt) - toTimestamp(right.occurredAt),
    )
    .filter((moment, index, all) => {
      const firstIndex = all.findIndex(
        (candidate) =>
          candidate.occurredAt === moment.occurredAt &&
          candidate.title === moment.title,
      );
      return firstIndex === index;
    });
};

export function buildJourneyChapters({
  songs,
  archives,
  milestones,
  playCountState,
  favorites,
  videoTitlesById = {},
  now = new Date(),
}: JourneyDataInput): JourneyChapter[] {
  const favoriteKeys = new Set(
    favorites.map((entry) => `${entry.videoId}\0${String(entry.start)}`),
  );
  const originalReleaseGroups = buildOriginalReleaseGroups(songs, now);
  const activityMilestones = buildActivityMilestones(songs, milestones);
  const supplementalArchives = buildSupplementalArchives(archives, now);
  const azkiChannelArchives = archives.filter(
    (archive) => archive.channel_id === siteConfig.channelId,
  );

  return ROUTE_RANGES.map((route, index) => {
    const chapterReleaseGroups = originalReleaseGroups.filter((release) =>
      isWithinRange(release.releasedAt, route.from, route.to, now),
    );
    const chapterSongs = chapterReleaseGroups.map(
      (release) => release.representative,
    );
    const chapterArchives = supplementalArchives.filter((archive) =>
      isWithinRange(
        archive.stream_started_at || archive.published_at,
        route.from,
        route.to,
        now,
      ),
    );
    const chapterVideoIds = new Set(
      azkiChannelArchives
        .filter((archive) =>
          isWithinRange(
            archive.stream_started_at || archive.published_at,
            route.from,
            route.to,
            now,
          ),
        )
        .map((archive) => archive.video_id)
        .filter(Boolean),
    );
    const chapterMilestones = activityMilestones.filter((milestone) =>
      isWithinRange(milestone.date, route.from, route.to, now),
    );
    const chapterPersonalSongs = songs.filter((song) =>
      isWithinRange(song.broadcast_at, route.from, route.to, now),
    );
    const moments = buildMoments({
      activityMilestones: chapterMilestones,
      mediaArchives: archives,
      songs,
      videoTitlesById,
    });
    const chapterPlayCountKeys = new Set(
      chapterPersonalSongs.map((song) => getSongPlayCountKey(song)),
    );
    const plays = [...chapterPlayCountKeys].reduce(
      (total, key) => total + (playCountState.records[key]?.playCount ?? 0),
      0,
    );
    const chapterFavoriteKeys = new Set(
      chapterPersonalSongs.map(
        (song) => `${song.video_id}\0${String(song.start)}`,
      ),
    );
    const favoritesCount = [...favoriteKeys].filter((key) =>
      chapterFavoriteKeys.has(key),
    ).length;

    return {
      id: `phase-${index + 1}`,
      labelKey: route.labelKey,
      fallbackLabel: route.label,
      from: route.from,
      to: route.to,
      songs: chapterSongs,
      representativeSongs: pickRepresentativeSongs(chapterReleaseGroups),
      moments,
      counts: {
        songs: chapterReleaseGroups.length,
        archives: chapterArchives.length,
        videos: chapterVideoIds.size,
        milestones: chapterMilestones.length,
      },
      personal: {
        plays,
        favorites: favoritesCount,
      },
    };
  }).filter(
    (chapter) =>
      chapter.counts.songs > 0 ||
      chapter.counts.archives > 0 ||
      chapter.counts.milestones > 0,
  );
}

export function getJourneyTotals(chapters: JourneyChapter[]) {
  return chapters.reduce(
    (totals, chapter) => ({
      songs: totals.songs + chapter.counts.songs,
      archives: totals.archives + chapter.counts.archives,
      videos: totals.videos + chapter.counts.videos,
      milestones: totals.milestones + chapter.counts.milestones,
      plays: totals.plays + chapter.personal.plays,
      favorites: totals.favorites + chapter.personal.favorites,
    }),
    {
      songs: 0,
      archives: 0,
      videos: 0,
      milestones: 0,
      plays: 0,
      favorites: 0,
    },
  );
}
