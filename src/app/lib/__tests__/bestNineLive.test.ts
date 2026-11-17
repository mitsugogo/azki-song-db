import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import {
  buildBestNineLiveChoices,
  matchingLiveChoices,
  isBestNineLiveAllowed,
  isBestNineVideoAllowed,
  bestNineWorkKey,
  getBestNineLiveRecordings,
  bestNineLiveChoiceKey,
} from "../bestNineLive";
import {
  normalizeBestNineSettings,
  bestNineColumns,
} from "../bestNineSettings";
import {
  normalizeSelection,
  encodeSelection,
  decodeSelection,
  resolveBestNineSlots,
} from "../myBestNineSongs";

import { departureGroups } from "./fixtures/bestNineLive";
const song = {
  title: "without U",
  artist: "AZKi",
  video_id: "video",
  start: 0,
  tags: ["オリ曲MV"],
} as Song;

describe("ライブセトリを使う1〜9曲のお題", () => {
  it("AZKiのソロ・メドレー・共演曲を含み、他の出演者と歌唱者不明の曲を除外する", () => {
    const choices = buildBestNineLiveChoices(departureGroups);
    expect(choices.map((choice) => choice.title)).toEqual([
      "未来カンパネラ",
      "Creating world",
      "without U (Re:arrange ver.)",
      "Going My Way",
    ]);
    expect(choices[0].path).toBe("/lives/departure");
    const reordered = structuredClone(departureGroups);
    reordered[0].performances[0].setlist.reverse();
    expect(buildBestNineLiveChoices(reordered).at(-1)?.entryKey).toBe(
      choices[0].entryKey,
    );
  });
  it("曲順が空・重複でも項目を区別し、完全に同じ項目にも別のキーを付ける", () => {
    const groups = structuredClone(departureGroups);
    const first = groups[0].performances[0].setlist[0];
    groups[0].performances[0].setlist = [
      first,
      { ...first },
      { ...first, title: "別曲" },
    ];
    expect(
      new Set(buildBestNineLiveChoices(groups).map((choice) => choice.entryKey))
        .size,
    ).toBe(3);
  });
  it("既知の別バージョンと動画を対応付け、同名の他アーティストを許可しない", () => {
    const choices = buildBestNineLiveChoices(departureGroups);
    expect(matchingLiveChoices(song, choices)).toHaveLength(1);
    expect(
      isBestNineVideoAllowed(song, ["live-setlist"], choices, ["departure"]),
    ).toBe(true);
    expect(
      isBestNineVideoAllowed(song, ["all"], choices, ["another-show"]),
    ).toBe(false);
    expect(matchingLiveChoices({ ...song, artist: "別人" }, choices)).toEqual(
      [],
    );
    expect(
      matchingLiveChoices(
        { ...song, title: "without U (Unknown ver.)" },
        choices,
      ),
    ).toEqual([]);
    expect(bestNineWorkKey("いのち（2024 ver.）", "AZKi")).toBe(
      bestNineWorkKey("いのち", "AZKi"),
    );
    expect(
      matchingLiveChoices(
        { ...song, title: "Going My Way", artist: "AS_tar" },
        choices,
      ),
    ).toHaveLength(1);
    expect(isBestNineLiveAllowed(choices[0], ["cover"])).toBe(false);
  });
  it("歌枠を除外してオリ曲MV、アートトラックの順で代表動画を選ぶ", () => {
    const choices = buildBestNineLiveChoices(departureGroups);
    const choice = choices[2];
    const singing = {
      ...song,
      video_id: "singing",
      tags: ["歌枠"],
      broadcast_at: "2026-11-17",
    };
    const mv = { ...song, video_id: "music-video" };
    const art = {
      ...song,
      video_id: "art-track",
      tags: ["オリ曲", "アートトラック"],
    };
    const key = bestNineLiveChoiceKey(choice);
    const catalog = [singing, art, mv];
    expect(getBestNineLiveRecordings(choices, catalog).get(key)).toBe(mv);
    expect(
      getBestNineLiveRecordings(choices, [mv, art, singing]).get(key),
    ).toBe(mv);
    expect(getBestNineLiveRecordings(choices, [singing, art]).get(key)).toBe(
      art,
    );
    expect(getBestNineLiveRecordings(choices, [singing]).has(key)).toBe(false);
    expect(
      isBestNineVideoAllowed(
        singing,
        ["live-setlist"],
        choices,
        ["departure"],
        catalog,
      ),
    ).toBe(false);
    expect(
      isBestNineVideoAllowed(
        art,
        ["live-setlist"],
        choices,
        ["departure"],
        catalog,
      ),
    ).toBe(false);
    expect(
      isBestNineVideoAllowed(
        mv,
        ["live-setlist"],
        choices,
        ["departure"],
        catalog,
      ),
    ).toBe(true);
    expect(
      isBestNineVideoAllowed(
        art,
        ["live-setlist"],
        choices,
        ["departure"],
        [singing, art],
      ),
    ).toBe(true);
  });
  it("他の動画、会員限定MV、歌枠との混在行は代表動画にしない", () => {
    const choices = buildBestNineLiveChoices(departureGroups);
    const key = bestNineLiveChoiceKey(choices[2]);
    const catalog = [
      { ...song, tags: ["オリ曲"] },
      { ...song, tags: ["カバー曲MV"] },
      { ...song, tags: ["オリ曲MV", "歌枠コラボ"] },
      { ...song, is_members_only: true },
      { ...song, video_id: "" },
    ];
    expect(getBestNineLiveRecordings(choices, catalog).has(key)).toBe(false);
  });

  it("ライブ回答を動画なしで保存し、共有URLと往復できる", () => {
    const snapshot = buildBestNineLiveChoices(departureGroups)[0];
    const selection = {
      title: "今1番推したい1曲",
      songCount: 1,
      allowedLiveIds: ["departure"],
      hashtags: ["AZKiと未来へ"],
      songs: [
        {
          kind: "live" as const,
          liveId: snapshot.liveId,
          liveEntryKey: snapshot.entryKey,
          snapshot,
        },
      ],
    };
    expect(normalizeSelection(selection)).toEqual(selection);
    expect(decodeSelection(encodeSelection(selection))).toEqual(selection);
    const slots = resolveBestNineSlots(selection, []);
    expect(slots).toHaveLength(1);
    expect(slots[0].live).toEqual(snapshot);
    expect(slots[0].song).toBeUndefined();
    expect(
      normalizeSelection({
        ...selection,
        songs: [...selection.songs, ...selection.songs],
      }),
    ).toBeNull();
    expect(
      normalizeSelection({
        ...selection,
        songs: [{ ...selection.songs[0], slot: 1 }],
      }),
    ).toBeNull();
  });
  it.each([0, 10, 1.5, "1", NaN])(
    "最大曲数の不正値を拒否する: %s",
    (songCount) => {
      expect(normalizeBestNineSettings({ songCount })).toBeNull();
    },
  );
  it("ハッシュタグを正規化し、無効なタグを拒否する", () => {
    expect(
      normalizeBestNineSettings({
        hashtags: ["#AZKiと未来へ", "＃AZKiと未来へ", " "],
      }),
    ).toEqual({ songCount: 9, allowedLiveIds: [], hashtags: ["AZKiと未来へ"] });
    expect(normalizeBestNineSettings({ hashtags: ["two words"] })).toBeNull();
    expect(normalizeBestNineSettings({ hashtags: ["123"] })).toBeNull();
    expect(
      normalizeBestNineSettings({ hashtags: Array(6).fill("tag") }),
    ).toBeNull();
    expect([1, 3, 9].map(bestNineColumns)).toEqual([1, 2, 3]);
  });
});
