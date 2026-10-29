import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import {
  buildThemeQuery,
  decodeSelection,
  decodeThemes,
  emptyThemes,
  encodeJson,
  encodeSelection,
  matchesTemplate,
  normalizeSelection,
  resolveBestNineSlots,
} from "../myBestNineSongs";

const themes = emptyThemes();
themes[0] = "出会いの曲";
themes[8] = "歌枠から一曲";
const song = { video_id: "video", start: 10 } as Song;

describe("枠ごとのお題のデータ契約", () => {
  it("既存データを変えずに復元する", () => {
    const legacy = { title: "9選", songs: [{ v: "video", s: "10" }] };
    expect(normalizeSelection(legacy)).toEqual(legacy);
    expect(decodeSelection(encodeSelection(legacy))).toEqual(legacy);
    expect(resolveBestNineSlots(legacy, [song])[0].song).toBe(song);
  });

  it("日本語のお題・空き枠・同じ歌唱を往復する", () => {
    const selection = {
      title: "テーマ",
      themes,
      songs: [
        { v: "video", s: "10", slot: 0 },
        { v: "video", s: "10", slot: 8 },
      ],
    };
    expect(decodeSelection(encodeSelection(selection))).toEqual(selection);
    const slots = resolveBestNineSlots(selection, [song]);
    expect(slots).toHaveLength(9);
    expect(slots[0].song).toBe(song);
    expect(slots[1].entry).toBeUndefined();
    expect(slots[8]).toMatchObject({ theme: "歌枠から一曲", song });
  });

  it("取得できない曲の後ろの枠を詰めない", () => {
    const slots = resolveBestNineSlots(
      {
        title: "9選",
        themes,
        songs: [
          { v: "missing", s: "0", slot: 0 },
          { v: "video", s: "10s", slot: 8 },
        ],
      },
      [song],
    );
    expect(slots[0].entry?.v).toBe("missing");
    expect(slots[0].song).toBeUndefined();
    expect(slots[8].song).toBe(song);
  });

  it("タイトルと9題だけをお題URLに含める", () => {
    const params = new URLSearchParams(
      buildThemeQuery(" テスト & 題 ", themes),
    );
    expect(params.get("title")).toBe("テスト & 題");
    expect(decodeThemes(params.get("themes")!)).toEqual(themes);
    expect([...params.keys()]).toEqual(["title", "themes"]);
    expect(buildThemeQuery("旧お題", emptyThemes())).toBe(
      "title=" + encodeURIComponent("旧お題"),
    );
  });

  it("お題一致は空白を正規化して判断する", () => {
    const draft = { title: " テスト ", themes, songs: [] };
    expect(matchesTemplate(draft, "テスト", themes)).toBe(true);
    expect(matchesTemplate(draft, "別のお題", themes)).toBe(false);
    expect(matchesTemplate(draft, "テスト", emptyThemes())).toBe(false);
    expect(
      matchesTemplate({ title: "旧", songs: [] }, "旧", emptyThemes()),
    ).toBe(true);
  });

  it.each([
    { themes: ["短い配列"] },
    { themes: [...emptyThemes(), "10題目"] },
    { themes: Array(9).fill(1) },
    { themes: Array(9).fill("あ".repeat(51)) },
    { themes, songs: [{ v: "v", s: "0", slot: -1 }] },
    { themes, songs: [{ v: "v", s: "0", slot: 9 }] },
    { themes, songs: [{ v: "v", s: "0", slot: 0.5 }] },
    { themes, songs: [{ v: "v", s: "0", slot: "0" }] },
    {
      themes,
      songs: [
        { v: "v", s: "0", slot: 1 },
        { v: "w", s: "0", slot: 1 },
      ],
    },
    { songs: Array(10).fill({ v: "v", s: "0" }) },
  ])("不正な保存データを拒否する: %j", (invalid) => {
    expect(
      normalizeSelection({
        title: "テスト",
        songs: [{ v: "v", s: "0" }],
        ...invalid,
      }),
    ).toBeNull();
  });

  it("空欄のお題は従来形式へ戻し、50文字のお題を受け付ける", () => {
    expect(
      normalizeSelection({
        title: "9選",
        themes: emptyThemes(),
        songs: [{ v: "v", s: "0", slot: 0 }],
      }),
    ).toEqual({ title: "9選", songs: [{ v: "v", s: "0" }] });
    expect(
      normalizeSelection({
        title: "9選",
        themes: Array(9).fill("あ".repeat(50)),
        songs: [{ v: "v", s: 0 }],
      })?.songs[0],
    ).toEqual({ v: "v", s: "0", slot: 0 });
  });

  it("下書きは未選曲でも保持し、不正なお題URLを拒否する", () => {
    expect(
      normalizeSelection({ title: "", themes, songs: [] }, true)?.themes,
    ).toEqual(themes);
    expect(normalizeSelection({ title: "9選", songs: [] })).toBeNull();
    expect(decodeThemes("broken!")).toBeNull();
    expect(decodeThemes(encodeJson(["1題だけ"]))).toBeNull();
    expect(decodeSelection("broken!")).toBeNull();
  });
});
