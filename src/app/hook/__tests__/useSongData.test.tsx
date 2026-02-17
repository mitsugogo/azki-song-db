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
  },
];

const mockVideoInfo: VideoInfo[] = [
  {
    id: "cover1",
    title: "Cover Video Title",
    description: "Description",
    publishedAt: "2024-01-01T00:00:00Z",
    viewCount: "1000",
    likeCount: "100",
    commentCount: "10",
  },
  {
    id: "original1",
    title: "Original Video Title",
    description: "Description",
    publishedAt: "2024-01-02T00:00:00Z",
    viewCount: "2000",
    likeCount: "200",
    commentCount: "20",
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

  it("曲データを取得できる", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/songs") {
        return Promise.resolve({
          ok: true,
          json: async () => mockSongs,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    const { result } = renderHook(() => useSongData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.songs).toHaveLength(3);
  });
});
