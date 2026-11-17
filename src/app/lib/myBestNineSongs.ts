import {
  normalizeBestNineSettings,
  bestNineSettingsSnapshot,
  type BestNineSettings,
} from "./bestNineSettings";
import { normalizeLiveSnapshot, type BestNineLiveChoice } from "./bestNineLive";
import type { Song } from "@/app/types/song";
import {
  hasCategoryRestrictions,
  normalizeSlotCategories,
  type BestNineCategory,
} from "./bestNineCategories";

export const MAX_BEST_NINE_SONGS = 9;
export const emptyThemes = () => Array<string>(9).fill("");
export type MyBestNineSongsEntry = (
  | {
      kind?: "video";
      v: string;
      s: string;
      liveId?: never;
      liveEntryKey?: never;
      snapshot?: never;
    }
  | {
      kind: "live";
      liveId: string;
      liveEntryKey: string;
      snapshot?: BestNineLiveChoice;
      v?: never;
      s?: never;
    }
) & { slot?: number };
export const bestNineEntryKey = (entry: MyBestNineSongsEntry) =>
  entry.kind === "live"
    ? JSON.stringify(["live", entry.liveId, entry.liveEntryKey])
    : JSON.stringify([entry.v, entry.s]);
export type MyBestNineSongs = BestNineSettings & {
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

/** 1曲のお題なし回答は見出しを省略し、複数曲では枠番号だけを表示する。 */
export const bestNineSlotHeading = (
  slot: number,
  theme: string | undefined,
  selectedCount: number,
) => {
  const text = theme?.trim();
  return text
    ? `${slot + 1}. ${text}`
    : selectedCount > 1
      ? `${slot + 1}.`
      : "";
};

export const hasFixedSlots = (
  selection?: Pick<
    MyBestNineSongs,
    "themes" | "slotCategories" | "songCount"
  > | null,
) =>
  hasThemes(selection?.themes?.slice(0, selection.songCount ?? 9)) ||
  hasCategoryRestrictions(
    selection?.slotCategories?.slice(0, selection.songCount ?? 9),
  );

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
  const settings = normalizeBestNineSettings(value);
  if (!settings) return null;
  if (typeof value.title !== "string" || (!allowEmpty && !value.title.trim()))
    return null;
  if (
    !Array.isArray(value.songs) ||
    value.songs.length > settings.songCount ||
    (!allowEmpty && !value.songs.length)
  )
    return null;
  const themes =
    value.themes === undefined ? undefined : normalizeThemes(value.themes);
  if (themes === null) return null;
  const slotCategories = normalizeSlotCategories(value.slotCategories);
  if (!slotCategories) return null;
  const restricted = hasCategoryRestrictions(
    slotCategories.slice(0, settings.songCount),
  );
  const themed = hasThemes(themes?.slice(0, settings.songCount)) || restricted;
  const slots = new Set<number>();
  const songs: MyBestNineSongsEntry[] = [];
  for (const [index, raw] of value.songs.entries()) {
    if (!raw || typeof raw !== "object") return null;
    const entry = raw as Record<string, unknown>;
    if (
      entry.kind !== "live" &&
      (typeof entry.v !== "string" ||
        !entry.v.trim() ||
        (typeof entry.s !== "string" && typeof entry.s !== "number") ||
        !String(entry.s).trim())
    )
      return null;
    const slot = entry.slot === undefined ? index : entry.slot;
    if (
      typeof slot !== "number" ||
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= settings.songCount ||
      slots.has(slot)
    )
      return null;
    slots.add(slot);
    if (entry.kind === "live") {
      if (
        typeof entry.liveId !== "string" ||
        !entry.liveId.trim() ||
        entry.liveId.length > 200 ||
        typeof entry.liveEntryKey !== "string" ||
        !entry.liveEntryKey ||
        entry.liveEntryKey.length > 4000
      )
        return null;
      const snapshot = normalizeLiveSnapshot(entry.snapshot);
      if (
        entry.snapshot !== undefined &&
        (!snapshot ||
          snapshot.liveId !== entry.liveId ||
          snapshot.entryKey !== entry.liveEntryKey)
      )
        return null;
      songs.push({
        kind: "live",
        liveId: entry.liveId,
        liveEntryKey: entry.liveEntryKey,
        ...(snapshot ? { snapshot } : {}),
        ...(themed ? { slot } : {}),
      });
    } else {
      if (entry.kind !== undefined && entry.kind !== "video") return null;
      songs.push({
        v: (entry.v as string).trim(),
        s: String(entry.s).trim(),
        ...(themed ? { slot } : {}),
      });
    }
  }
  return {
    title: value.title,
    ...bestNineSettingsSnapshot({
      ...settings,
      songCount: value.songCount === undefined ? undefined : settings.songCount,
    }),
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
    ...bestNineSettingsSnapshot(selection),
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
        songCount: value.songCount,
        allowedLiveIds: value.allowedLiveIds,
        hashtags: value.hashtags,
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
  const slots = Array.from({ length: selection.songCount ?? 9 }, (_, slot) => ({
    slot,
    theme: selection.themes?.[slot] ?? "",
    entry: undefined as MyBestNineSongsEntry | undefined,
    song: undefined as Song | undefined,
    live: undefined as BestNineLiveChoice | undefined,
  }));
  selection.songs.forEach((entry, index) => {
    const slot = entry.slot ?? index;
    if (!slots[slot]) return;
    slots[slot].entry = entry;
    if (entry.kind === "live") {
      slots[slot].live = entry.snapshot;
      return;
    }
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
