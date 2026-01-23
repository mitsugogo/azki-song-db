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
    expect(result.current.coverSongInfo).toEqual([]);
    expect(result.current.originalSongInfo).toEqual([]);
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

  it("カバー曲の動画情報を取得できる", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/songs") {
        return Promise.resolve({
          ok: true,
          json: async () => mockSongs,
        });
      }
      if (url.includes("/api/yt/info") && url.includes("cover1")) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockVideoInfo[0]],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    const { result } = renderHook(() => useSongData());

    await waitFor(() => {
      expect(result.current.coverSongInfo.length).toBeGreaterThan(0);
    });

    expect(result.current.coverSongInfo).toHaveLength(1);
    expect(result.current.coverSongInfo[0].id).toBe("cover1");
  });

  it("オリジナル曲の動画情報を取得できる", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/songs") {
        return Promise.resolve({
          ok: true,
          json: async () => mockSongs,
        });
      }
      if (url.includes("/api/yt/info") && url.includes("original1")) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockVideoInfo[1]],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    const { result } = renderHook(() => useSongData());

    await waitFor(() => {
      expect(result.current.originalSongInfo.length).toBeGreaterThan(0);
    });

    expect(result.current.originalSongInfo).toHaveLength(1);
    expect(result.current.originalSongInfo[0].id).toBe("original1");
  });

  it("API呼び出し失敗時にエラーを処理する", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/songs") {
        return Promise.resolve({
          ok: true,
          json: async () => mockSongs,
        });
      }
      return Promise.reject(new Error("Network error"));
    });

    const { result } = renderHook(() => useSongData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // エラーが発生しても空配列が設定される
    await waitFor(() => {
      expect(result.current.coverSongInfo).toEqual([]);
      expect(result.current.originalSongInfo).toEqual([]);
    });

    consoleErrorSpy.mockRestore();
  });

  it("曲が0件の場合は動画情報を取得しない", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/songs") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
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

    expect(result.current.songs).toHaveLength(0);
    expect(result.current.coverSongInfo).toEqual([]);
    expect(result.current.originalSongInfo).toEqual([]);
  });
});
