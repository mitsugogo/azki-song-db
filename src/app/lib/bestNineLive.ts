import type { LiveTitleGroup } from "@/app/types/live";
import type { Song } from "@/app/types/song";
import type { BestNineCategory } from "./bestNineCategories";
import { isBestNineSongAllowed } from "./bestNineCategories";
import { getLivePerformancePath } from "./livePaths";
import {
  isArtTrack,
  sortReleaseVariants,
} from "@/app/discography/utils/releaseVariants";

export type BestNineLiveChoice = {
  liveId: string;
  entryKey: string;
  order: string;
  title: string;
  artist: string;
  singers: string;
  liveTitle: string;
  performance: string;
  date: string;
  path: string;
  titleEn?: string;
  artistEn?: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// バージョン表記を一般的に削らず、確認できた対応だけを同一曲として扱う。
const versionTitles: Record<string, string> = {
  "from a to z (re:arrange ver.)": "from a to z",
  "without u (re:arrange ver.)": "without u",
  "フロンティアローカス (re:arrange ver.)": "フロンティアローカス",
  "青い夢 (re:arrange ver.)": "青い夢",
  "いのち (2024 ver.)": "いのち",
  "the last frontier - 5th fes. live ver. -": "the last frontier",
};
const titleKey = (title: string) => {
  const key = normalize(title).replace(/\s*\(/g, " (");
  return versionTitles[key] ?? key;
};
const artistKey = (artist: string) => {
  const key = normalize(artist);
  if (key === "as_tar") return "azki、星街すいせい";
  return key
    .split(/[,、]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .sort()
    .join("、");
};
export const bestNineWorkKey = (title: string, artist: string) =>
  JSON.stringify([titleKey(title), artistKey(artist)]);

export const isAzkiLiveSinger = (singers: string) =>
  /(?:^|[^a-z0-9])AZKi(?=$|[^a-z0-9])/i.test(singers.normalize("NFKC"));

export function buildBestNineLiveChoices(
  groups: LiveTitleGroup[],
): BestNineLiveChoice[] {
  return groups.flatMap((group) =>
    group.performances.flatMap((performance) => {
      const occurrences = new Map<string, number>();
      return performance.setlist.flatMap((entry) => {
        if (!isAzkiLiveSinger(entry.singers)) return [];
        const identity = JSON.stringify(
          [entry.order, entry.title, entry.artist, entry.singers].map(
            normalize,
          ),
        );
        const occurrence = occurrences.get(identity) ?? 0;
        occurrences.set(identity, occurrence + 1);
        return [
          {
            liveId: performance.id,
            entryKey: JSON.stringify([identity, occurrence]),
            order: entry.order,
            title: entry.title,
            artist: entry.artist,
            singers: entry.singers,
            liveTitle: performance.title,
            performance: performance.performance,
            date: performance.date,
            path: getLivePerformancePath(group, performance.id)!,
            ...(entry.titleEn ? { titleEn: entry.titleEn } : {}),
            ...(entry.artistEn ? { artistEn: entry.artistEn } : {}),
          },
        ];
      });
    }),
  );
}

const liveChoiceIndexes = new WeakMap<
  BestNineLiveChoice[],
  Map<string, BestNineLiveChoice[]>
>();
export function matchingLiveChoices(song: Song, choices: BestNineLiveChoice[]) {
  let index = liveChoiceIndexes.get(choices);
  if (!index) {
    index = new Map();
    for (const choice of choices) {
      const key = bestNineWorkKey(choice.title, choice.artist);
      const entries = index.get(key) ?? [];
      entries.push(choice);
      index.set(key, entries);
    }
    liveChoiceIndexes.set(choices, index);
  }
  const title = song.hl?.ja?.title || song.title;
  const artist = song.hl?.ja?.artist || song.artist;
  const titles = [title, ...(song.title_aliases ?? [])];
  const artists = [artist, ...(song.artist_aliases ?? [])];
  const matches = new Set<BestNineLiveChoice>();
  for (const value of titles)
    for (const name of artists)
      for (const choice of index.get(bestNineWorkKey(value, name)) ?? [])
        matches.add(choice);
  return [...matches];
}

export const bestNineLiveChoiceKey = (
  choice: Pick<BestNineLiveChoice, "liveId" | "entryKey">,
) => JSON.stringify([choice.liveId, choice.entryKey]);

const liveRecordingIndexes = new WeakMap<
  Song[],
  WeakMap<BestNineLiveChoice[], Map<string, Song>>
>();

/** セトリ1曲につきオリ曲MVを優先し、なければアートトラックを使う。歌枠は候補にしない。 */
export function getBestNineLiveRecordings(
  choices: BestNineLiveChoice[],
  songs: Song[],
) {
  let indexes = liveRecordingIndexes.get(songs);
  if (!indexes) {
    indexes = new WeakMap();
    liveRecordingIndexes.set(songs, indexes);
  }
  const cached = indexes.get(choices);
  if (cached) return cached;
  const eligible = songs.filter(
    (song) =>
      !song.is_members_only &&
      song.video_id?.trim() &&
      Number.isFinite(Number(song.start)) &&
      Number(song.start) >= 0 &&
      !song.tags?.some((tag) => tag.includes("歌枠")) &&
      (song.tags?.includes("オリ曲MV") || isArtTrack(song)),
  );
  const recordings = new Map<string, Song>();
  for (const song of sortReleaseVariants(eligible)) {
    for (const choice of matchingLiveChoices(song, choices)) {
      const key = bestNineLiveChoiceKey(choice);
      if (!recordings.has(key)) recordings.set(key, song);
    }
  }
  indexes.set(choices, recordings);
  return recordings;
}

export function isBestNineVideoAllowed(
  song: Song,
  categories: readonly BestNineCategory[] | undefined,
  choices: BestNineLiveChoice[],
  allowedLiveIds: readonly string[] = [],
  catalog?: Song[],
) {
  if (!song) return false;
  if (!allowedLiveIds.length && !categories?.includes("live-setlist"))
    return isBestNineSongAllowed(song, categories);
  const matches = matchingLiveChoices(song, choices);
  const recordings = getBestNineLiveRecordings(choices, catalog ?? [song]);
  const isPreferred = matches.some((choice) => {
    if (allowedLiveIds.length && !allowedLiveIds.includes(choice.liveId))
      return false;
    const preferred = recordings.get(bestNineLiveChoiceKey(choice));
    return (
      preferred?.video_id === song.video_id &&
      Number(preferred.start) === Number(song.start)
    );
  });
  if (allowedLiveIds.length && !isPreferred) return false;
  return (
    isBestNineSongAllowed(song, categories) ||
    (!!categories?.includes("live-setlist") && isPreferred)
  );
}

export function isBestNineLiveAllowed(
  choice: BestNineLiveChoice,
  categories?: readonly BestNineCategory[],
  allowedLiveIds: readonly string[] = [],
) {
  return (
    (!allowedLiveIds.length || allowedLiveIds.includes(choice.liveId)) &&
    (!categories ||
      categories.includes("all") ||
      categories.includes("live-setlist"))
  );
}

export function normalizeLiveSnapshot(
  value: unknown,
): BestNineLiveChoice | undefined {
  if (!value || typeof value !== "object") return;
  const raw = value as Record<string, unknown>;
  const keys = [
    "liveId",
    "entryKey",
    "order",
    "title",
    "artist",
    "singers",
    "liveTitle",
    "performance",
    "date",
    "path",
  ] as const;
  if (
    keys.some(
      (key) =>
        typeof raw[key] !== "string" || (raw[key] as string).length > 4000,
    ) ||
    !(raw.path as string).startsWith("/lives/") ||
    (raw.path as string).includes("\\") ||
    !raw.title
  )
    return;
  return Object.fromEntries(
    [...keys, "titleEn", "artistEn"]
      .filter((key) => typeof raw[key] === "string")
      .map((key) => [key, raw[key]]),
  ) as BestNineLiveChoice;
}
