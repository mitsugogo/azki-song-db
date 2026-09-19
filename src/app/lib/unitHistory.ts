import type { UnitDefinition, UnitHighlightType } from "../config/units";
import { getLocalizedUnitText } from "../config/units";
import { getArtTrackVideoIdsHiddenWhenMusicVideoExists } from "../discography/utils/releaseVariants";
import type { Song } from "../types/song";
import { getDiscographyLink } from "./song";
import { buildWatchHref } from "./watchUrl";

export type UnitHistoryEntry = {
  id: string;
  date: string;
  type: UnitHighlightType;
  title: string;
  description?: string;
  href?: string;
  youtubeHref?: string;
  videoId?: string;
};

const FORMAL_WORK_TAGS = new Set([
  "オリ曲",
  "オリ曲MV",
  "カバー曲",
  "ユニット曲",
  "コラボ楽曲",
]);
const UNIT_HERO_VIDEO_TAGS = new Set(["オリ曲MV", "カバー曲MV"]);

const splitSingerNames = (song: Song) => {
  if (song.sings?.length) return song.sings.map((name) => name.trim());
  return String(song.sing || "")
    .split(/[、,，/]/)
    .map((name) => name.trim())
    .filter(Boolean);
};

const memberMatches = (name: string, aliases: string[]) =>
  aliases.some(
    (alias) =>
      alias.localeCompare(name, undefined, { sensitivity: "accent" }) === 0,
  );

export function songIncludesEveryUnitMember(song: Song, unit: UnitDefinition) {
  const singers = splitSingerNames(song);
  return unit.members.every((member) =>
    singers.some((singer) => memberMatches(singer, member.aliases)),
  );
}

const namesHaveExactUnitLineup = (singers: string[], unit: UnitDefinition) => {
  const names = singers.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return false;
  return (
    unit.members.every((member) =>
      names.some((singer) => memberMatches(singer, member.aliases)),
    ) &&
    names.every((singer) =>
      unit.members.some((member) => memberMatches(singer, member.aliases)),
    )
  );
};

const songHasExactUnitLineup = (song: Song, unit: UnitDefinition) =>
  namesHaveExactUnitLineup(splitSingerNames(song), unit);

export function isUnitWork(song: Song, unit: UnitDefinition) {
  const isExactUnitLineup = songHasExactUnitLineup(song, unit);
  const hasUnitTag = song.tags.some((tag) => unit.tags.includes(tag));
  const hasFormalWorkTag = song.tags.some((tag) => FORMAL_WORK_TAGS.has(tag));
  return hasFormalWorkTag && (hasUnitTag || isExactUnitLineup);
}

const toJstDateKey = (value: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getSongDate = (song: Song) =>
  toJstDateKey(song.album_release_at || song.broadcast_at || "");

const getWorkKey = (song: Song) =>
  song.slugv2 || `${song.title}\u0000${song.artist}`;

export function getUnitWorks(songs: Song[], unit: UnitDefinition) {
  const works = new Map<string, Song>();
  songs
    .filter((song) => isUnitWork(song, unit))
    .forEach((song) => {
      const key = getWorkKey(song);
      const previous = works.get(key);
      if (!previous || getSongDate(song) < getSongDate(previous)) {
        works.set(key, song);
      }
    });
  return [...works.values()].sort((a, b) =>
    getSongDate(a).localeCompare(getSongDate(b)),
  );
}

export function getUnitAchievementSongs(songs: Song[]) {
  const hiddenArtTrackVideoIds =
    getArtTrackVideoIdsHiddenWhenMusicVideoExists(songs);
  return songs.filter((song) => !hiddenArtTrackVideoIds.has(song.video_id));
}

export function pickUnitHeroBackgroundSong(
  songs: Song[],
  unit: UnitDefinition,
) {
  const candidatesByVideoId = new Map<string, Song>();
  songs.forEach((song) => {
    const isHeroVideo = song.tags.some((tag) => UNIT_HERO_VIDEO_TAGS.has(tag));
    if (
      !song.video_id ||
      song.is_members_only ||
      !isHeroVideo ||
      !isUnitWork(song, unit)
    ) {
      return;
    }
    if (!candidatesByVideoId.has(song.video_id)) {
      candidatesByVideoId.set(song.video_id, song);
    }
  });

  const candidates = [...candidatesByVideoId.values()];
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function getUnitSingingStats(songs: Song[], unit: UnitDefinition) {
  const performances = songs.filter((song) =>
    songHasExactUnitLineup(song, unit),
  );
  const counts = new Map<string, number>();
  performances.forEach((song) => {
    const key = song.title.trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const ranked = [...counts.entries()]
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ja"));
  return {
    performances,
    uniqueSongCount: counts.size,
    performanceCount: performances.length,
    ranked,
  };
}

const KARAOKE_KEYWORDS = ["歌枠", "カラオケ", "karaoke"] as const;

const looksLikeKaraoke = (value: string) =>
  KARAOKE_KEYWORDS.some((keyword) =>
    value.toLocaleLowerCase("ja").includes(keyword.toLocaleLowerCase("ja")),
  );

const isKaraokePerformance = (song: Song) =>
  song.tags.some((tag) => looksLikeKaraoke(tag)) ||
  looksLikeKaraoke(song.video_title);

const videoHasExactUnitLineup = (songs: Song[], unit: UnitDefinition) =>
  namesHaveExactUnitLineup(songs.flatMap(splitSingerNames), unit);

const pickKaraokeStreamSong = (songs: Song[]) =>
  songs.reduce((best, song) => {
    const bestDate = best.broadcast_at || "";
    const songDate = song.broadcast_at || "";
    if (songDate && (!bestDate || songDate < bestDate)) return song;
    if (songDate === bestDate && song.start < best.start) return song;
    return best;
  });

export type UnitKaraokeStream = {
  videoId: string;
  title: string;
  videoUrl: string;
  broadcastAt: string;
};

export function getUnitKaraokeStreams(songs: Song[], unit: UnitDefinition) {
  const songsByVideo = new Map<string, Song[]>();
  songs.forEach((song) => {
    if (!song.video_id) return;
    const current = songsByVideo.get(song.video_id);
    if (current) current.push(song);
    else songsByVideo.set(song.video_id, [song]);
  });

  return [...songsByVideo.values()].flatMap((videoSongs) => {
    if (!videoSongs.some(isKaraokePerformance)) return [];
    if (!videoHasExactUnitLineup(videoSongs, unit)) return [];

    const representative = pickKaraokeStreamSong(videoSongs);
    const videoId = representative.video_id;
    return [
      {
        videoId,
        title: representative.video_title.trim() || representative.title,
        videoUrl:
          representative.video_uri ||
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        broadcastAt: representative.broadcast_at || "",
      } satisfies UnitKaraokeStream,
    ];
  });
}

export function getUnitKaraokeVideoIds(songs: Song[], unit: UnitDefinition) {
  return getUnitKaraokeStreams(songs, unit).map((stream) => stream.videoId);
}

const KARAOKE_ARCHIVE_TOPIC_KEYWORDS = [...KARAOKE_KEYWORDS, "歌"] as const;

export function isKaraokeArchiveTopic(topic: string) {
  const normalized = topic.toLocaleLowerCase("ja");
  return KARAOKE_ARCHIVE_TOPIC_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLocaleLowerCase("ja")),
  );
}

export function keepUnitArchiveItem(
  item: { video_id: string; topic: string },
  unitKaraokeVideoIds: ReadonlySet<string>,
) {
  if (unitKaraokeVideoIds.has(item.video_id)) return true;
  if (!isKaraokeArchiveTopic(item.topic)) return true;
  return unitKaraokeVideoIds.size === 0;
}

const getUnitMilestone = (song: Song, unit: UnitDefinition) =>
  (song.milestones || []).find((milestone) =>
    unit.tags.some(
      (tag) =>
        tag.localeCompare(milestone.trim(), undefined, {
          sensitivity: "accent",
        }) === 0,
    ),
  );

function buildUnitMilestoneHistory(
  unit: UnitDefinition,
  songs: Song[],
  nowKey: string,
) {
  const entriesByVideo = new Map<
    string,
    { song: Song; milestone: string; date: string }
  >();

  songs.forEach((song) => {
    if (!song.broadcast_at) return;
    const milestone = getUnitMilestone(song, unit);
    if (!milestone) return;

    const date = toJstDateKey(song.broadcast_at).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > nowKey) return;

    const title = song.video_title.trim() || milestone.trim();
    const key = song.video_id || `${date}\u0000${title}`;
    const previous = entriesByVideo.get(key);
    if (
      !previous ||
      date < previous.date ||
      (date === previous.date && song.start < previous.song.start)
    ) {
      entriesByVideo.set(key, { song, milestone, date });
    }
  });

  return [...entriesByVideo.entries()].map(
    ([key, { song, milestone, date }]): UnitHistoryEntry => ({
      id: `milestone-${key}`,
      date,
      type: "stream",
      title: song.video_title.trim() || milestone.trim(),
      href: song.video_id
        ? buildWatchHref({ videoId: song.video_id, start: song.start })
        : undefined,
      youtubeHref: song.video_id
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(song.video_id)}`
        : song.video_uri || undefined,
      videoId: song.video_id || undefined,
    }),
  );
}

export function buildUnitHistory(
  unit: UnitDefinition,
  songs: Song[],
  locale: string,
  now = new Date(),
) {
  const nowParts = getJstDateParts(now);
  const nowKey = `${nowParts.year}-${String(nowParts.month).padStart(2, "0")}-${String(nowParts.day).padStart(2, "0")}`;
  const curated: UnitHistoryEntry[] = unit.highlights
    .filter((highlight) => highlight.date <= nowKey)
    .map((highlight, index) => ({
      id: `highlight-${highlight.date}-${index}`,
      date: highlight.date,
      type: highlight.type,
      title: getLocalizedUnitText(highlight.title, locale),
      description: highlight.description
        ? getLocalizedUnitText(highlight.description, locale)
        : undefined,
      href: highlight.url,
      youtubeHref: highlight.videoId
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(highlight.videoId)}`
        : undefined,
      videoId: highlight.videoId,
    }));
  const milestoneEntries = buildUnitMilestoneHistory(unit, songs, nowKey);
  const mergedMilestoneIds = new Set<string>();
  const curatedWithMilestoneData = curated.map((entry) => {
    const milestoneEntry = milestoneEntries.find(
      (candidate) =>
        candidate.date === entry.date &&
        (!entry.videoId || candidate.videoId === entry.videoId),
    );
    if (!milestoneEntry) return entry;

    mergedMilestoneIds.add(milestoneEntry.id);
    return {
      ...entry,
      href: entry.href || milestoneEntry.href,
      youtubeHref: entry.youtubeHref || milestoneEntry.youtubeHref,
      videoId: entry.videoId || milestoneEntry.videoId,
    };
  });
  const works =
    unit.includeWorksInHistory === false ? [] : getUnitWorks(songs, unit);
  const automatic: UnitHistoryEntry[] = works
    .filter((song) => getSongDate(song))
    .map((song) => ({
      id: `work-${getWorkKey(song)}`,
      date: getSongDate(song).slice(0, 10),
      type: "music" as const,
      title: song.title,
      description: song.video_title || undefined,
      href: getDiscographyLink(song) ?? undefined,
      youtubeHref: song.video_id
        ? `https://www.youtube.com/watch?v=${encodeURIComponent(song.video_id)}`
        : undefined,
      videoId: song.video_id || undefined,
    }));

  const deduped = new Map<string, UnitHistoryEntry>();
  [
    ...curatedWithMilestoneData,
    ...automatic,
    ...milestoneEntries.filter((entry) => !mergedMilestoneIds.has(entry.id)),
  ].forEach((entry) => {
    const key = `${entry.date}\u0000${entry.title}`;
    if (!deduped.has(key)) deduped.set(key, entry);
  });
  return [...deduped.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "ja"),
  );
}

export function getJstDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

export function getUnitActivityDays(unit: UnitDefinition, now: Date) {
  return getActivityDaysSince(unit.formedAt, now);
}

const getActivityDaysSince = (startedAt: string, now: Date) => {
  const formed = startedAt.split("-").map(Number);
  const current = getJstDateParts(now);
  const formedTime = Date.UTC(formed[0], formed[1] - 1, formed[2]);
  const currentTime = Date.UTC(current.year, current.month - 1, current.day);
  return Math.max(0, Math.floor((currentTime - formedTime) / 86_400_000));
};

export function getUnitLegacyActivityDays(unit: UnitDefinition, now: Date) {
  return unit.legacy ? getActivityDaysSince(unit.legacy.startedAt, now) : null;
}
