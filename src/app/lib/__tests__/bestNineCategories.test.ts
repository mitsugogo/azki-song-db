import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import {
  emptySlotCategories,
  normalizeSlotCategories,
  isBestNineSongAllowed,
  matchesBestNineCategory,
} from "../bestNineCategories";
import { validateTopicInput } from "../bestNineTopics";
import {
  emptyThemes,
  encodeSelection,
  decodeSelection,
  normalizeSelection,
  resolveBestNineSlots,
} from "../myBestNineSongs";

const song = {
  title: "いのち",
  artist: "AZKi",
  sing: "AZKi",
  tags: ["オリ曲"],
  video_id: "video",
  start: 0,
} as Song;

describe("枠ごとの回答カテゴリ", () => {
  it("省略は9枠とも全て。指定は枠順を維持し、複数カテゴリを正規化する", () => {
    expect(normalizeSlotCategories(undefined)).toEqual(emptySlotCategories());
    const slots = emptySlotCategories();
    slots[0] = ["original"];
    slots[8] = ["cover", "original"];
    expect(
      validateTopicInput({
        title: "題",
        themes: emptyThemes(),
        slotCategories: slots,
      }).slotCategories,
    ).toEqual([
      ["original"],
      ...emptySlotCategories().slice(1, 8),
      ["original", "cover"],
    ]);
  });
  it.each([
    null,
    "all",
    [],
    Array(8).fill(["all"]),
    Array(10).fill(["all"]),
    Array(9).fill([]),
    Array(9).fill(["unknown"]),
    Array(9).fill(["all", "cover"]),
    Array(9).fill("original"),
  ])("不正なカテゴリ指定を拒否する: %j", (slotCategories) => {
    expect(() => validateTopicInput({ title: "題", slotCategories })).toThrow(
      "INVALID_TOPIC",
    );
  });
  it("複数指定はOR判定で、枠間には適用しない", () => {
    expect(isBestNineSongAllowed(song, ["original", "cover"])).toBe(true);
    expect(
      isBestNineSongAllowed({ ...song, tags: ["カバー曲"] }, [
        "original",
        "cover",
      ]),
    ).toBe(true);
    expect(
      isBestNineSongAllowed({ ...song, tags: ["歌枠"] }, ["original", "cover"]),
    ).toBe(false);
    expect(isBestNineSongAllowed(song, ["all"])).toBe(true);
    expect(
      matchesBestNineCategory(
        { ...song, tags: ["ユニット曲", "オリ曲"] },
        "unit-guest",
      ),
    ).toBe(true);
    expect(
      matchesBestNineCategory({ ...song, tags: ["歌枠"] }, "live-singing"),
    ).toBe(true);
    expect(
      matchesBestNineCategory(
        { ...song, tags: ["歌枠コラボ"] },
        "collaboration",
      ),
    ).toBe(true);
  });
  it("英語表示でも日本語の曲名・歌手でカテゴリを判定する", () => {
    expect(
      isBestNineSongAllowed(
        {
          ...song,
          artist: "English artist",
          hl: { ja: { title: song.title, artist: "AZKi", artists: ["AZKi"] } },
        },
        ["original"],
      ),
    ).toBe(true);
  });
  it("枠タイトルがすべて空でもカテゴリ制限があれば位置を保存し、旧URLと往復できる", () => {
    const slots = emptySlotCategories();
    slots[8] = ["original"];
    const selection = {
      title: "題",
      themes: emptyThemes(),
      slotCategories: slots,
      songs: [{ v: "video", s: "0", slot: 8 }],
    };
    expect(normalizeSelection(selection)).toEqual(selection);
    expect(decodeSelection(encodeSelection(selection))).toEqual(selection);
    expect(
      resolveBestNineSlots(normalizeSelection(selection)!, [song])[8].song,
    ).toBe(song);
    expect(
      normalizeSelection({
        ...selection,
        slotCategories: emptySlotCategories(),
        songs: [{ v: "video", s: "0" }],
      }),
    ).toEqual({ title: "題", songs: [{ v: "video", s: "0" }] });
  });
});
