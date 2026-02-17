import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useSongData } from "../useSongData";
import type { Song } from "../../types/song";
import type { VideoInfo } from "../../types/videoInfo";

const mockSongs: Song[] = [
  {
    video_id: "cover1",
    start: "0",
    title: "Cover Song",
    artist: "Original Artist",
    album: "Album",
    sing: "AZKi",
    tags: ["カバー曲"],
    broadcast_at: "2024-01-01",
    video_title: "Cover Video",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "",
    end: "",
    year: 0,
    milestones: [],
  },
  {
    video_id: "original1",
    start: "0",
    title: "Original Song",
    artist: "AZKi",
    album: "Album",
    sing: "AZKi",
    tags: ["オリ曲"],
    broadcast_at: "2024-01-02",
    video_title: "Original Video",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "",
    end: "",
    year: 0,
    milestones: [],
  },
  {
    video_id: "other1",
    start: "0",
    title: "Other Song",
    artist: "Other Artist",
    album: "Album",
    sing: "Other Singer",
    tags: ["その他"],
    broadcast_at: "2024-01-03",
    video_title: "Other Video",
    lyricist: "",
    composer: "",
    arranger: "",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "",
    end: "",
    year: 0,
    milestones: [],
  },
];

global.fetch = vi.fn();

describe("useSongData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態ではローディング中", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useSongData());

    expect(result.current.loading).toBe(true);
    expect(result.current.songs).toEqual([]);
  });
});
