import { describe, expect, it } from "vitest";
import { Song } from "../../../types/song";
import { isSungByAzki } from "../azkiOnly";

const createSong = (sings: string[]): Song => ({
  video_id: "video-id",
  title: "Song",
  artist: "Artist",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: sings.join("、"),
  sings,
  video_title: "",
  video_uri: "",
  start: 0,
  end: 0,
  broadcast_at: "2026-01-01",
  year: 2026,
  tags: [],
  milestones: [],
  hl: {
    ja: {
      title: "Song",
      artist: "Artist",
      artists: ["Artist"],
      sing: sings.join("、"),
      sings,
    },
  },
});

describe("isSungByAzki", () => {
  it("sings に AZKi が含まれる曲だけ true を返す", () => {
    expect(isSungByAzki(createSong(["AZKi"]))).toBe(true);
    expect(isSungByAzki(createSong(["星街すいせい", "AZKi"]))).toBe(true);
    expect(isSungByAzki(createSong(["星街すいせい"]))).toBe(false);
  });
});
