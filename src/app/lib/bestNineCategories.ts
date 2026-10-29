import type { Song } from "@/app/types/song";
import {
  isPossibleOriginalSong,
  isCoverSong,
  isCollaborationSong,
} from "@/app/config/filters";

export const BEST_NINE_CATEGORIES = [
  "all",
  "original",
  "cover",
  "unit-guest",
  "live-singing",
  "collaboration",
] as const;
export type BestNineCategory = (typeof BEST_NINE_CATEGORIES)[number];
export const bestNineCategoryLabel: Record<BestNineCategory, string> = {
  all: "all",
  original: "original",
  cover: "cover",
  "unit-guest": "unitGuest",
  "live-singing": "liveSinging",
  collaboration: "collaboration",
};

/** 省略は従来どおり全曲。空配列や「全て」と個別指定の混在は受け付けない。 */
export function normalizeAllowedCategories(
  value: unknown,
): BestNineCategory[] | null {
  if (value === undefined) return ["all"];
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > BEST_NINE_CATEGORIES.length ||
    value.some((item) => !BEST_NINE_CATEGORIES.includes(item)) ||
    (value.includes("all") && value.length !== 1)
  )
    return null;
  return BEST_NINE_CATEGORIES.filter((category) => value.includes(category));
}

export function matchesBestNineCategory(
  song: Song,
  category: BestNineCategory,
): boolean {
  // 表示言語を変えても保存時の日本語カタログと同じ判定にする。
  const canonical = {
    ...song,
    title: song.hl?.ja?.title || song.title,
    artist: song.hl?.ja?.artist || song.artist,
  };
  switch (category) {
    case "all":
      return true;
    case "original":
      return isPossibleOriginalSong(canonical);
    case "cover":
      return isCoverSong(canonical);
    case "unit-guest":
      return isCollaborationSong(canonical);
    case "live-singing":
      return song.tags.includes("歌枠");
    case "collaboration":
      return song.tags.some((tag) => tag.includes("コラボ"));
  }
}

export const emptySlotCategories = (): BestNineCategory[][] =>
  Array.from({ length: 9 }, () => ["all"]);

export function normalizeSlotCategories(
  value: unknown,
): BestNineCategory[][] | null {
  if (value === undefined) return emptySlotCategories();
  if (
    !Array.isArray(value) ||
    value.length !== 9 ||
    value.some((slot) => !Array.isArray(slot))
  )
    return null;
  const slots = value.map(normalizeAllowedCategories);
  return slots.every((slot): slot is BestNineCategory[] => slot !== null)
    ? slots
    : null;
}

export const hasCategoryRestrictions = (
  slots?: readonly (readonly BestNineCategory[])[],
) => !!slots?.some((categories) => !categories.includes("all"));

export function isBestNineSongAllowed(
  song: Song,
  categories?: readonly BestNineCategory[],
): boolean {
  return (
    !categories ||
    categories.some((category) => matchesBestNineCategory(song, category))
  );
}
