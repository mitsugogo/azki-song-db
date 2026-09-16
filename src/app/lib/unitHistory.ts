import type { UnitDefinition, UnitHighlightType } from "../config/units";
import { getLocalizedUnitText } from "../config/units";
import type { Song } from "../types/song";
import { getDiscographyLink } from "./song";

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

export function isUnitWork(song: Song, unit: UnitDefinition) {
  const singers = splitSingerNames(song);
  const isExactUnitLineup =
    singers.length === unit.members.length &&
    songIncludesEveryUnitMember(song, unit);
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
    songIncludesEveryUnitMember(song, unit),
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

export function buildUnitHistory(
  unit: UnitDefinition,
  works: Song[],
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
  [...curated, ...automatic].forEach((entry) => {
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
  const formed = unit.formedAt.split("-").map(Number);
  const current = getJstDateParts(now);
  const formedTime = Date.UTC(formed[0], formed[1] - 1, formed[2]);
  const currentTime = Date.UTC(current.year, current.month - 1, current.day);
  return Math.max(0, Math.floor((currentTime - formedTime) / 86_400_000));
}
