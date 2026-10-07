import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import {
  buildRepertoire,
  filterRepertoire,
  getRepertoirePlaybackLinks,
  getRepertoireSources,
  sortRepertoire,
} from "../repertoire";

const song = (overrides: Partial<Song> = {}) =>
  ({
    title: "曲A",
    artist: "原曲歌手",
    sings: ["AZKi"],
    tags: ["歌枠"],
    song_tags: [],
    video_id: "abcdefghijk",
    video_uri: "https://youtu.be/abcdefghijk",
    start: 10,
    broadcast_at: "2026-01-01T15:00:00.000Z",
    ...overrides,
  }) as Song;

describe("repertoire", () => {
  it.each([
    ["title", "Alpha"],
    ["artist", "Zulu"],
    ["source", "Zulu"],
    ["tags", "Zulu"],
    ["count", "Alpha"],
    ["latest", "Alpha"],
  ])("sorts %s in both directions", (sort, ascendingFirst) => {
    const entries = buildRepertoire([
      song({
        title: "Alpha",
        artist: "Z",
        tags: ["Z"],
        broadcast_at: "2026-01-01",
      }),
      song({
        title: "Zulu",
        artist: "A",
        tags: ["A", "歌枠"],
        broadcast_at: "2026-02-01",
      }),
      song({
        title: "Zulu",
        artist: "A",
        tags: ["A", "歌枠"],
        broadcast_at: "2026-02-02",
        video_id: "lmnopqrstuv",
      }),
    ]);
    expect(sortRepertoire(entries, sort, "en", "asc")[0].title).toBe(
      ascendingFirst,
    );
    expect(sortRepertoire(entries, sort, "en", "desc")[0].title).toBe(
      ascendingFirst === "Alpha" ? "Zulu" : "Alpha",
    );
  });

  it("keeps unknown dates last when sorting oldest or newest first", () => {
    const entries = buildRepertoire([
      song({ title: "Unknown", broadcast_at: "" }),
      song({ title: "Known" }),
    ]);
    expect(sortRepertoire(entries, "latest", "en", "asc")[1].title).toBe(
      "Unknown",
    );
    expect(sortRepertoire(entries, "latest", "en", "desc")[1].title).toBe(
      "Unknown",
    );
  });

  it("groups by original title and artist, combines labels/tags and selects the latest performance", () => {
    const old = song({ song_tags: ["アニソン"], title_aliases: ["よみがな"] });
    const latest = song({
      video_id: "lmnopqrstuv",
      broadcast_at: "2026-02-01T15:00:00.000Z",
      start: 45,
      tags: ["ゲスト出演"],
      song_tags: ["バラード"],
    });
    const entries = buildRepertoire([
      latest,
      old,
      old,
      song({ artist: "別の歌手" }),
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      latest,
      count: 2,
      sources: ["singing", "collaboration"],
      tags: expect.arrayContaining([
        "歌枠",
        "ゲスト出演",
        "アニソン",
        "バラード",
      ]),
    });
    expect(filterRepertoire(entries, "よみがな", "", [])).toHaveLength(1);
  });

  it("keeps a collaborative singing stream in both categories and distinguishes recorded songs", () => {
    expect(
      getRepertoireSources(song({ sings: ["AZKi", "星街すいせい"] })),
    ).toEqual(["singing", "collaboration"]);
    expect(getRepertoireSources(song({ tags: ["3Dライブ"] }))).toEqual([
      "collaboration",
    ]);
    expect(getRepertoireSources(song({ tags: ["オリ曲MV"] }))).toEqual([
      "other",
    ]);
    expect(getRepertoireSources(song({ tags: ["ライブ課題曲"] }))).toEqual([
      "other",
    ]);
  });

  it("excludes non-AZKi singers and member-only performances", () => {
    expect(
      buildRepertoire([
        song({ sings: ["NotAZKi"] }),
        song({ sings: [] }),
        song({ is_members_only: true }),
        song({ sings: ["ＡＺＫｉ"] }),
      ]),
    ).toHaveLength(1);
  });

  it("groups translated displays using Japanese originals and searches aliases and both languages", () => {
    const hl = {
      ja: {
        title: "曲A",
        artist: "原曲歌手",
        artists: ["原曲歌手"],
        sings: ["AZKi"],
      },
    };
    const entries = buildRepertoire([
      song({ hl }),
      song({
        title: "Song A",
        artist: "Original Artist",
        hl,
        artist_aliases: ["歌手の別名"],
      }),
    ]);
    expect(entries).toHaveLength(1);
    expect(
      filterRepertoire(entries, "ｓｏｎｇ 歌手の別名", "singing", ["歌枠"]),
    ).toHaveLength(1);
  });

  it("combines search, source and all selected tags and sorts without mutating entries", () => {
    const entries = buildRepertoire([
      song({ tags: ["歌枠", "しっとり"], song_tags: ["アニソン"] }),
      song({ title: "曲B", tags: ["コラボ"], broadcast_at: "2026-03-01" }),
    ]);
    expect(
      filterRepertoire(entries, "曲A アニソン", "singing", [
        "歌枠",
        "しっとり",
      ]),
    ).toHaveLength(1);
    expect(filterRepertoire(entries, "曲A", "collaboration", [])).toHaveLength(
      0,
    );
    expect(filterRepertoire(entries, "", "", ["歌枠", "コラボ"])).toHaveLength(
      0,
    );
    expect(sortRepertoire(entries, "latest", "ja")[0].title).toBe("曲B");
    expect(sortRepertoire(entries, "title", "ja")[0].title).toBe("曲A");
    expect(entries[0].title).toBe("曲A");
  });

  it("uses the later start for the same video/date and ignores unknown dates when choosing the latest", () => {
    const entries = buildRepertoire([
      song({ broadcast_at: "" }),
      song(),
      song({ start: 55 }),
    ]);
    expect(entries[0].latest.start).toBe(55);
    expect(entries[0].latest.broadcast_at).toBe("2026-01-01T15:00:00.000Z");
  });

  it("creates start-position links for the same latest performance with safe fallbacks", () => {
    expect(getRepertoirePlaybackLinks(song({ start: 45.5 }))).toEqual({
      youtube: "https://www.youtube.com/watch?v=abcdefghijk&t=45s",
      songDb: "/watch?v=abcdefghijk&t=45",
    });
    expect(getRepertoirePlaybackLinks(song({ start: -1 }))?.songDb).toBe(
      "/watch?v=abcdefghijk&t=0",
    );
    expect(getRepertoirePlaybackLinks(song({ video_id: "" }))).toBeNull();
  });
});
