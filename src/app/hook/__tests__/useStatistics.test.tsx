import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStatistics } from "../useStatistics";
import type { Song } from "../../types/song";
import type { VideoInfo } from "../../types/videoInfo";

// createStatisticsをモック
vi.mock("../../lib/statisticsHelpers", () => ({
  createStatistics: vi.fn((songs, accessor) => {
    // シンプルなモック実装
    return [
      {
        name: "Test Item",
        count: songs.length,
        firstVideo: songs[0],
        lastVideo: songs[songs.length - 1],
      },
    ];
  }),
}));

describe("useStatistics", () => {
  const mockSongs: Song[] = [
    {
      video_id: "test1",
      start: "0",
      title: "Song One",
      artist: "AZKi",
      album: "Album X",
      sing: "AZKi",
      tags: ["オリ曲", "tag1"],
      broadcast_at: "2024-01-01",
      video_title: "Video One",
    },
    {
      video_id: "test2",
      start: "0",
      title: "Song Two",
      artist: "Artist B",
      album: "Album Y",
      sing: "AZKi",
      tags: ["カバー曲", "tag2"],
      broadcast_at: "2024-01-02",
      video_title: "Video Two",
    },
  ];

  const mockCoverSongInfo: VideoInfo[] = [
    {
      id: "test2",
      title: "Cover Video",
      description: "Description",
      publishedAt: "2024-01-02T00:00:00Z",
      viewCount: "1000",
      likeCount: "100",
      commentCount: "10",
    },
  ];

  const mockOriginalSongInfo: VideoInfo[] = [
    {
      id: "test1",
      title: "Original Video",
      description: "Description",
      publishedAt: "2024-01-01T00:00:00Z",
      viewCount: "2000",
      likeCount: "200",
      commentCount: "20",
    },
  ];

  it("統計データを計算する", () => {
    const { result } = renderHook(() =>
      useStatistics({
        songs: mockSongs,
        coverSongInfo: mockCoverSongInfo,
        originalSongInfo: mockOriginalSongInfo,
      }),
    );

    expect(result.current.songCounts).toBeDefined();
    expect(result.current.artistCounts).toBeDefined();
    expect(result.current.originalSongCounts).toBeDefined();
    expect(result.current.tagCounts).toBeDefined();
    expect(result.current.milestoneCounts).toBeDefined();
    expect(result.current.videoCounts).toBeDefined();
    expect(result.current.originalSongCountsByReleaseDate).toBeDefined();
    expect(result.current.coverSongCountsByReleaseDate).toBeDefined();
  });

  it("曲データが変更されると統計が再計算される", () => {
    const { result, rerender } = renderHook(
      ({ songs, coverSongInfo, originalSongInfo }) =>
        useStatistics({ songs, coverSongInfo, originalSongInfo }),
      {
        initialProps: {
          songs: mockSongs,
          coverSongInfo: mockCoverSongInfo,
          originalSongInfo: mockOriginalSongInfo,
        },
      },
    );

    const initialSongCounts = result.current.songCounts;

    const newSongs: Song[] = [
      ...mockSongs,
      {
        video_id: "test3",
        start: "0",
        title: "Song Three",
        artist: "Artist C",
        album: "Album Z",
        sing: "AZKi",
        tags: ["tag3"],
        broadcast_at: "2024-01-03",
        video_title: "Video Three",
      },
    ];

    rerender({
      songs: newSongs,
      coverSongInfo: mockCoverSongInfo,
      originalSongInfo: mockOriginalSongInfo,
    });

    // useMemoによってキャッシュされるため、参照が変わることを確認
    expect(result.current.songCounts).not.toBe(initialSongCounts);
  });

  it("空の配列で初期化しても動作する", () => {
    const { result } = renderHook(() =>
      useStatistics({
        songs: [],
        coverSongInfo: [],
        originalSongInfo: [],
      }),
    );

    expect(result.current.songCounts).toBeDefined();
    expect(result.current.artistCounts).toBeDefined();
    expect(result.current.originalSongCounts).toBeDefined();
    expect(result.current.tagCounts).toBeDefined();
  });

  it("各統計データが配列として返される", () => {
    const { result } = renderHook(() =>
      useStatistics({
        songs: mockSongs,
        coverSongInfo: mockCoverSongInfo,
        originalSongInfo: mockOriginalSongInfo,
      }),
    );

    expect(Array.isArray(result.current.songCounts)).toBe(true);
    expect(Array.isArray(result.current.artistCounts)).toBe(true);
    expect(Array.isArray(result.current.originalSongCounts)).toBe(true);
    expect(Array.isArray(result.current.tagCounts)).toBe(true);
    expect(Array.isArray(result.current.milestoneCounts)).toBe(true);
    expect(Array.isArray(result.current.videoCounts)).toBe(true);
    expect(Array.isArray(result.current.originalSongCountsByReleaseDate)).toBe(
      true,
    );
    expect(Array.isArray(result.current.coverSongCountsByReleaseDate)).toBe(
      true,
    );
  });
});
