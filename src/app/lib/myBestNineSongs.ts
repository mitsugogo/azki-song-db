import type { Song } from "@/app/types/song";
import {
  hasCategoryRestrictions,
  normalizeSlotCategories,
  type BestNineCategory,
} from "./bestNineCategories";

export const MAX_BEST_NINE_SONGS = 9;
export const emptyThemes = () => Array<string>(9).fill("");
export type MyBestNineSongsEntry = { v: string; s: string; slot?: number };
export type MyBestNineSongs = {
  title: string;
  author?: string;
  themes?: string[];
  slotCategories?: BestNineCategory[][];
  topicId?: string;
  topicVersion?: number;
  songs: MyBestNineSongsEntry[];
};

export const hasThemes = (themes?: string[]) =>
  !!themes?.some((theme) => theme.trim());

export const hasFixedSlots = (
  selection?: Pick<MyBestNineSongs, "themes" | "slotCategories"> | null,
) =>
  hasThemes(selection?.themes) ||
  hasCategoryRestrictions(selection?.slotCategories);

export const normalizeStart = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim().replace(/s$/i, "");
  if (!text) return null;
  return Number.isFinite(Number(text)) ? String(Number(text)) : text;
};

export const normalizeThemes = (input: unknown): string[] | null => {
  if (!Array.isArray(input) || input.length !== 9) return null;
  if (input.some((theme) => typeof theme !== "string" || theme.length > 50))
    return null;
  return input.map((theme: string) => theme.trim());
};

export function normalizeSelection(
  input: unknown,
  allowEmpty = false,
): MyBestNineSongs | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (typeof value.title !== "string" || (!allowEmpty && !value.title.trim()))
    return null;
  if (
    !Array.isArray(value.songs) ||
    value.songs.length > 9 ||
    (!allowEmpty && !value.songs.length)
  )
    return null;
  const themes =
    value.themes === undefined ? undefined : normalizeThemes(value.themes);
  if (themes === null) return null;
  const slotCategories = normalizeSlotCategories(value.slotCategories);
  if (!slotCategories) return null;
  const restricted = hasCategoryRestrictions(slotCategories);
  const themed = hasThemes(themes) || restricted;
  const slots = new Set<number>();
  const songs: MyBestNineSongsEntry[] = [];
  for (const [index, raw] of value.songs.entries()) {
    if (!raw || typeof raw !== "object") return null;
    const entry = raw as Record<string, unknown>;
    if (
      typeof entry.v !== "string" ||
      !entry.v.trim() ||
      (typeof entry.s !== "string" && typeof entry.s !== "number") ||
      !String(entry.s).trim()
    )
      return null;
    const slot = entry.slot === undefined ? index : entry.slot;
    if (
      typeof slot !== "number" ||
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot > 8 ||
      slots.has(slot)
    )
      return null;
    slots.add(slot);
    songs.push({
      v: entry.v.trim(),
      s: String(entry.s).trim(),
      ...(themed ? { slot } : {}),
    });
  }
  return {
    title: value.title,
    author: typeof value.author === "string" ? value.author : undefined,
    ...(themed ? { themes: themes ?? emptyThemes() } : {}),
    ...(restricted ? { slotCategories } : {}),
    ...(typeof value.topicId === "string" &&
    typeof value.topicVersion === "number"
      ? { topicId: value.topicId, topicVersion: value.topicVersion }
      : {}),
    songs: themed ? songs.sort((a, b) => a.slot! - b.slot!) : songs,
  };
}

export const encodeJson = (value: unknown) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const decodeJson = (value: string): unknown => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
    ),
  );
};

export const encodeSelection = (selection: MyBestNineSongs) =>
  encodeJson({
    t: selection.title,
    a: selection.author,
    s: selection.songs,
    ...(hasThemes(selection.themes) ? { q: selection.themes } : {}),
    ...(hasCategoryRestrictions(selection.slotCategories)
      ? { c: selection.slotCategories }
      : {}),
  });

export const decodeSelection = (param: string): MyBestNineSongs | null => {
  try {
    const value = decodeJson(param) as Record<string, unknown>;
    if (!value || typeof value !== "object") return null;
    const selection = normalizeSelection(
      {
        title: value.t,
        author: value.a,
        songs: value.s ?? [],
        themes: value.q,
        slotCategories: value.c,
      },
      true,
    );
    return selection?.title.trim() ? selection : null;
  } catch {
    return null;
  }
};

export const decodeThemes = (param: string): string[] | null => {
  try {
    return normalizeThemes(decodeJson(param));
  } catch {
    return null;
  }
};

export const buildThemeQuery = (title: string, themes?: string[]) => {
  const params = new URLSearchParams({ title: title.trim().slice(0, 50) });
  if (hasThemes(themes))
    params.set("themes", encodeJson(themes!.map((theme) => theme.trim())));
  return params.toString();
};

export const matchesTemplate = (
  draft: MyBestNineSongs,
  title: string,
  themes?: string[],
) =>
  draft.title.trim().slice(0, 50) === title.trim().slice(0, 50) &&
  JSON.stringify(
    draft.themes?.map((theme) => theme.trim()) ?? emptyThemes(),
  ) === JSON.stringify(themes?.map((theme) => theme.trim()) ?? emptyThemes());

export const resolveBestNineSlots = (
  selection: MyBestNineSongs,
  songs: Song[],
) => {
  const slots = Array.from({ length: 9 }, (_, slot) => ({
    slot,
    theme: selection.themes?.[slot] ?? "",
    entry: undefined as MyBestNineSongsEntry | undefined,
    song: undefined as Song | undefined,
  }));
  selection.songs.forEach((entry, index) => {
    const slot = entry.slot ?? index;
    if (!slots[slot]) return;
    const start = normalizeStart(entry.s);
    const exact =
      start === null
        ? undefined
        : songs.find(
            (song) =>
              song.video_id === entry.v && normalizeStart(song.start) === start,
          );
    const sameVideo = exact
      ? []
      : songs.filter((song) => song.video_id === entry.v);
    slots[slot].entry = entry;
    slots[slot].song =
      exact ?? (sameVideo.length === 1 ? sameVideo[0] : undefined);
  });
  return slots;
};
