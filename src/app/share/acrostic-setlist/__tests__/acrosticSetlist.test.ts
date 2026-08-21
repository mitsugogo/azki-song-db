import { describe, expect, it } from "vitest";
import type { Song } from "@/app/types/song";
import {
  buildAcrosticCandidateIndex,
  buildAcrosticCopyText,
  buildAcrosticPlaylistEntries,
  normalizeAcrosticInitial,
  parseAcrosticInput,
  reconcileAcrosticAssignments,
} from "../acrosticSetlist";

const createSong = (overrides: Partial<Song> = {}): Song => ({
  title: "afterglow",
  title_aliases: ["あふたー"],
  artist: "AZKi",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "AZKi",
  sings: ["AZKi"],
  video_title: "配信",
  video_uri: "https://youtu.be/video-id",
  video_id: "video-id",
  start: 10,
  end: 100,
  broadcast_at: "2026-01-01T00:00:00.000Z",
  year: 2026,
  tags: [],
  milestones: [],
  hl: {
    ja: {
      title: overrides.title ?? "afterglow",
      artist: overrides.artist ?? "AZKi",
      artists: [overrides.artist ?? "AZKi"],
      sing: overrides.sing ?? "AZKi",
      sings: overrides.sings ?? ["AZKi"],
    },
  },
  ...overrides,
});

describe("acrosticSetlist", () => {
  it("入力を文字単位に分け、空白と記号を除いて正規化する", () => {
    const result = parseAcrosticInput(" Ａ・ア カ_1! ");

    expect(result.characters).toEqual([
      { character: "A", normalizedCharacter: "a" },
      { character: "ア", normalizedCharacter: "あ" },
      { character: "カ", normalizedCharacter: "か" },
      { character: "1", normalizedCharacter: "1" },
    ]);
    expect(result.eligibleCount).toBe(4);
    expect(result.isOverLimit).toBe(false);
    expect(parseAcrosticInput("あ".repeat(51)).isOverLimit).toBe(true);
  });

  it("小書きかなを直前のかなとまとめ、促音は独立して扱う", () => {
    expect(parseAcrosticInput("じゃ ティ きって ｼﾞｭ").characters).toEqual([
      { character: "じゃ", normalizedCharacter: "じゃ" },
      { character: "ティ", normalizedCharacter: "てぃ" },
      { character: "き", normalizedCharacter: "き" },
      { character: "っ", normalizedCharacter: "っ" },
      { character: "て", normalizedCharacter: "て" },
      { character: "ジュ", normalizedCharacter: "じゅ" },
    ]);
  });

  it("先頭装飾、全半角、英字大小、ひらがな・カタカナを吸収する", () => {
    expect(normalizeAcrosticInitial("♡Ａfterglow")).toBe("a");
    expect(normalizeAcrosticInitial(" アフター")).toBe("あ");
    expect(normalizeAcrosticInitial("あふたー")).toBe("あ");
    expect(normalizeAcrosticInitial("ヷルツ")).toBe(
      normalizeAcrosticInitial("わ゙るつ"),
    );
    expect(normalizeAcrosticInitial("♡ジャスト・ビー・フレンズ")).toBe("じゃ");
  });

  it("拗音で始まる読み別名を1つの頭文字として索引化する", () => {
    const index = buildAcrosticCandidateIndex([
      createSong({
        title: "Just Be Friends",
        title_aliases: ["じゃすとびーふれんず", "じぇいびーえふ"],
      }),
    ]);

    expect(index.byInitial.get("じゃ")?.[0].matches.get("じゃ")).toEqual({
      source: "alias",
      value: "じゃすとびーふれんず",
    });
    expect(index.byInitial.has("じ")).toBe(false);
    expect(index.byInitial.has("じぇ")).toBe(false);
    expect(
      reconcileAcrosticAssignments(
        parseAcrosticInput("じゃ").characters,
        index,
        [],
        false,
      )[0].selectedCandidateKey,
    ).toBe(index.candidates[0].key);
  });

  it("AZKi歌唱曲を曲単位にまとめ、別名を索引化して最新歌唱を採用する", () => {
    const index = buildAcrosticCandidateIndex([
      createSong({
        video_id: "older",
        broadcast_at: "2025-01-01T00:00:00.000Z",
      }),
      createSong({
        video_id: "newer",
        start: 20,
        broadcast_at: "2026-02-01T00:00:00.000Z",
      }),
      createSong({
        title: "AZKi以外の曲",
        artist: "別アーティスト",
        sing: "星街すいせい",
        sings: ["星街すいせい"],
        video_id: "not-azki",
        hl: {
          ja: {
            title: "AZKi以外の曲",
            artist: "別アーティスト",
            artists: ["別アーティスト"],
            sing: "星街すいせい",
            sings: ["星街すいせい"],
          },
        },
      }),
    ]);

    expect(index.candidates).toHaveLength(1);
    expect(index.candidates[0].song.video_id).toBe("newer");
    expect(index.byInitial.get("a")?.[0].song.title).toBe("afterglow");
    expect(index.byInitial.get("あ")?.[0].matches.get("あ")).toEqual({
      source: "alias",
      value: "あふたー",
    });
  });

  it("配信日時が不正な歌唱回を候補から除外する", () => {
    const index = buildAcrosticCandidateIndex([
      createSong({ title: "Invalid Date", broadcast_at: "not-a-date" }),
    ]);

    expect(index.candidates).toHaveLength(0);
  });

  it("通常は曲を重複させず、許可時は同じ曲を再利用する", () => {
    const index = buildAcrosticCandidateIndex([
      createSong({
        title: "あさがお",
        artist: "Artist A",
        video_id: "newest-a",
        broadcast_at: "2026-03-01T00:00:00.000Z",
        title_aliases: [],
        hl: {
          ja: {
            title: "あさがお",
            artist: "Artist A",
            artists: ["Artist A"],
            sing: "AZKi",
            sings: ["AZKi"],
          },
        },
      }),
      createSong({
        title: "あめふり",
        artist: "Artist B",
        video_id: "older-a",
        broadcast_at: "2025-03-01T00:00:00.000Z",
        title_aliases: [],
        hl: {
          ja: {
            title: "あめふり",
            artist: "Artist B",
            artists: ["Artist B"],
            sing: "AZKi",
            sings: ["AZKi"],
          },
        },
      }),
    ]);
    const targets = parseAcrosticInput("ああ").characters;

    const unique = reconcileAcrosticAssignments(targets, index, [], false);
    expect(unique.map((row) => row.selectedCandidateKey)).toHaveLength(2);
    expect(new Set(unique.map((row) => row.selectedCandidateKey)).size).toBe(2);

    const reused = reconcileAcrosticAssignments(
      targets,
      index,
      [
        unique[0],
        { ...unique[1], selectedCandidateKey: unique[0].selectedCandidateKey },
      ],
      true,
    );
    expect(reused[1].selectedCandidateKey).toBe(reused[0].selectedCandidateKey);

    const deduped = reconcileAcrosticAssignments(targets, index, reused, false);
    expect(deduped[0].selectedCandidateKey).toBe(
      reused[0].selectedCandidateKey,
    );
    expect(deduped[1].selectedCandidateKey).not.toBe(
      reused[0].selectedCandidateKey,
    );
  });

  it("未完成なら出力せず、完成時は表示順をコピー文とプレイリストへ渡す", () => {
    const index = buildAcrosticCandidateIndex([
      createSong({
        title: "あさがお",
        artist: "Artist A",
        video_id: "song-a",
        start: 15,
        title_aliases: [],
        hl: {
          ja: {
            title: "あさがお",
            artist: "Artist A",
            artists: ["Artist A"],
            sing: "AZKi",
            sings: ["AZKi"],
          },
        },
      }),
      createSong({
        title: "きらきら",
        artist: "Artist K",
        video_id: "song-k",
        start: 30,
        title_aliases: [],
        hl: {
          ja: {
            title: "きらきら",
            artist: "Artist K",
            artists: ["Artist K"],
            sing: "AZKi",
            sings: ["AZKi"],
          },
        },
      }),
    ]);
    const assignments = reconcileAcrosticAssignments(
      parseAcrosticInput("あき").characters,
      index,
      [],
      false,
    );

    expect(buildAcrosticCopyText(assignments, index)).toBe(
      "あ｜あさがお - Artist A\nき｜きらきら - Artist K",
    );
    expect(buildAcrosticPlaylistEntries(assignments, index)).toEqual([
      { videoId: "song-a", start: "15" },
      { videoId: "song-k", start: "30" },
    ]);

    const incomplete = [
      assignments[0],
      { ...assignments[1], selectedCandidateKey: null },
    ];
    expect(buildAcrosticCopyText(incomplete, index)).toBeNull();
    expect(buildAcrosticPlaylistEntries(incomplete, index)).toBeNull();
  });
});
