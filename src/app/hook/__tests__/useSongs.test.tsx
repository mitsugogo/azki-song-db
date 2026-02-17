import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import useSongs from "../useSongs";
import type { Song } from "../../types/song";

const mockSongs: Song[] = [
  {
    video_id: "test1",
    start: "0",
    end: "0",
    milestones: [],
    year: 2024,
    title: "Song One",
    artist: "Artist A",
    album: "Album X",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    tags: ["オリ曲", "tag1"],
    broadcast_at: "2024-01-01",
    video_title: "Video One",
    video_uri: "",
    lyricist: "",
    composer: "",
    arranger: "",
  },
  {
    video_id: "test2",
    start: "0",
    end: "0",
    milestones: [],
    year: 2024,
    title: "Song Two",
    artist: "Artist B、Artist C",
    album: "Album Y",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi、Guest",
    tags: ["カバー曲", "tag2"],
    broadcast_at: "2024-01-02",
    video_title: "Video Two",
    video_uri: "",
    lyricist: "",
    composer: "",
    arranger: "",
  },
  {
    video_id: "test3",
    start: "0",
    end: "0",
    year: 2024,
    title: "Song One",
    artist: "Artist A",
    album: "Album Z",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    sing: "AZKi",
    tags: ["tag1", "tag3"],
    broadcast_at: "2024-01-03",
    video_title: "Video Three",
    video_uri: "",
    milestones: ["1st Live"],
    lyricist: "",
    composer: "",
    arranger: "",
  },
];

global.fetch = vi.fn();

describe("useSongs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: async () => mockSongs,
    });
  });

  it("初期状態ではローディング中", () => {
    const { result } = renderHook(() => useSongs());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.allSongs).toEqual([]);
  });
});
