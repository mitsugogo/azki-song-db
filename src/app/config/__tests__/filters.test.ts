import { describe, expect, it } from "vitest";
import type { Song } from "../../types/song";
import {
  filterOriginalSongs,
  isCollaborationSong,
  isFesOverallSong,
  isOriginalSong,
  isOverallSong,
  isPossibleOriginalSong,
} from "../filters";

const createSong = (overrides: Partial<Song> = {}): Song =>
  ({
    title: "Original Song",
    artist: "AZKi",
    sing: "AZKi",
    tags: ["オリ曲"],
    ...overrides,
  }) as Song;

describe("全体曲の分類", () => {
  it("全体曲タグの楽曲をオリ曲・コラボ曲から分離する", () => {
    const song = createSong({ tags: ["オリ曲", "全体曲"] });

    expect(isOverallSong(song)).toBe(true);
    expect(isOriginalSong(song)).toBe(false);
    expect(isPossibleOriginalSong(song)).toBe(false);
    expect(filterOriginalSongs(song)).toBe(false);
    expect(isCollaborationSong(song)).toBe(false);
  });

  it("AZKi歌唱のfes全体曲をオリ曲・コラボ曲から分離する", () => {
    const song = createSong({
      sing: "AZKi、hololive members",
      tags: ["オリ曲", "ユニット曲", "fes全体曲"],
    });

    expect(isFesOverallSong(song)).toBe(true);
    expect(isOverallSong(song)).toBe(true);
    expect(isPossibleOriginalSong(song)).toBe(false);
    expect(isCollaborationSong(song)).toBe(false);
  });

  it("公式ソングをオリ曲・コラボ曲から分離する", () => {
    const song = createSong({ tags: ["オリ曲", "公式ソング"] });

    expect(isOverallSong(song)).toBe(true);
    expect(isOriginalSong(song)).toBe(false);
    expect(isPossibleOriginalSong(song)).toBe(false);
    expect(filterOriginalSongs(song)).toBe(false);
    expect(isCollaborationSong(song)).toBe(false);
  });

  it.each(["全体曲", "公式ソング"])(
    "%sタグがあってもAZKiが歌唱していなければ全体曲に含めない",
    (tag) => {
      const song = createSong({ sing: "hololive members", tags: [tag] });

      expect(isOverallSong(song)).toBe(false);
    },
  );

  it("通常のオリ曲とユニット曲は従来の分類を維持する", () => {
    const originalSong = createSong();
    const collaborationSong = createSong({ tags: ["オリ曲", "ユニット曲"] });

    expect(isOriginalSong(originalSong)).toBe(true);
    expect(isOverallSong(originalSong)).toBe(false);
    expect(isCollaborationSong(collaborationSong)).toBe(true);
    expect(isOverallSong(collaborationSong)).toBe(false);
  });
});
