import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStatistics } from "../useStatistics";
import type { Song } from "../../types/song";
import type { VideoInfo } from "../../types/videoInfo";
import { createStatistics } from "../../lib/statisticsHelpers";

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
  const createStatisticsMock = vi.mocked(createStatistics);

  beforeEach(() => {
    createStatisticsMock.mockClear();
  });

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
      video_id: "test2",
      start: "0",
      title: "Song Two",
      artist: "Artist B",
      album: "Album Y",
      sing: "AZKi",
      tags: ["カバー曲", "tag2"],
      broadcast_at: "2024-01-02",
      video_title: "Video Two",
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

  const mockCoverSongInfo: VideoInfo[] = [
    {
      videoId: "test2",
      title: "Cover Video",
      thumbnailUrl: "",
      snippet: {
        publishedAt: "",
        channelId: "",
        title: "",
        description: "",
      },
      statistics: {
        viewCount: "",
        likeCount: "",
        favoriteCount: "",
        commentCount: "",
      },
    },
  ];

  const mockOriginalSongInfo: VideoInfo[] = [
    {
      videoId: "test1",
      title: "Original Video",
      thumbnailUrl: "",
      snippet: {
        publishedAt: "",
        channelId: "",
        title: "",
        description: "",
      },
      statistics: {
        viewCount: "",
        likeCount: "",
        favoriteCount: "",
        commentCount: "",
      },
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

  it("オリ曲判定のフィルタ条件が正しく適用される", () => {
    const songs: Song[] = [
      {
        video_id: "ori-1",
        start: "0",
        title: "Original 1",
        artist: "AZKi、Guest",
        album: "",
        sing: "AZKi",
        tags: ["オリ曲"],
        broadcast_at: "2024-01-01",
        video_title: "Video O1",
        milestones: ["m1"],
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        end: "",
        year: 0,
      },
      {
        video_id: "ori-2",
        start: "0",
        title: "Original 2",
        artist: "Guest",
        album: "",
        sing: "AZKi",
        tags: ["オリ曲"],
        broadcast_at: "2024-01-02",
        video_title: "Video O2",
        milestones: ["m2"],
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        end: "",
        year: 0,
      },
    ];

    renderHook(() =>
      useStatistics({
        songs,
        coverSongInfo: mockCoverSongInfo,
        originalSongInfo: mockOriginalSongInfo,
      }),
    );

    const originalCall = createStatisticsMock.mock.calls.find(
      ([calledSongs, keyFn, sortFn, videoInfos]) =>
        calledSongs.length === 1 &&
        calledSongs[0].title === "Original 1" &&
        keyFn(calledSongs[0]) === "Original 1" &&
        !sortFn &&
        !videoInfos,
    );

    expect(originalCall).toBeTruthy();
  });

  it("リリース日ソート用のデータが正しく渡される", () => {
    const songs: Song[] = [
      {
        video_id: "ori-3",
        start: "0",
        title: "Original 3",
        artist: "AZKi",
        album: "",
        sing: "AZKi",
        tags: ["オリ曲"],
        broadcast_at: "2024-01-03",
        video_title: "Video O3",
        milestones: ["m3"],
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        end: "",
        year: 0,
      },
      {
        video_id: "cover-1",
        start: "0",
        title: "Cover 1",
        artist: "Artist X",
        album: "",
        sing: "AZKi",
        tags: ["カバー曲"],
        broadcast_at: "2024-01-04",
        video_title: "Video C1",
        milestones: ["m4"],
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        end: "",
        year: 0,
      },
    ];

    renderHook(() =>
      useStatistics({
        songs,
        coverSongInfo: mockCoverSongInfo,
        originalSongInfo: mockOriginalSongInfo,
      }),
    );

    const originalByReleaseCall = createStatisticsMock.mock.calls.find(
      ([calledSongs, keyFn, sortFn, videoInfos]) =>
        calledSongs.length === 1 &&
        calledSongs[0].title === "Original 3" &&
        keyFn(calledSongs[0]) === "Original 3" &&
        typeof sortFn === "function" &&
        videoInfos === mockOriginalSongInfo,
    );

    expect(originalByReleaseCall).toBeTruthy();

    const coverByReleaseCall = createStatisticsMock.mock.calls.find(
      ([calledSongs, keyFn, sortFn, videoInfos]) =>
        calledSongs.length === 1 &&
        calledSongs[0].title === "Cover 1" &&
        keyFn(calledSongs[0]) === "Cover 1 (Artist X) (AZKi)" &&
        typeof sortFn === "function" &&
        videoInfos === mockCoverSongInfo,
    );

    expect(coverByReleaseCall).toBeTruthy();

    const sortFn = originalByReleaseCall?.[2] as (a: any, b: any) => number;
    const compareResult = sortFn(
      { firstVideo: { broadcast_at: "2024-02-01" } },
      { firstVideo: { broadcast_at: "2024-01-01" } },
    );
    expect(compareResult).toBeLessThan(0);
  });

  it("マイルストーンと動画IDの集計が正しく渡される", () => {
    const songs: Song[] = [
      {
        video_id: "milestone-1",
        start: "0",
        title: "Milestone Song",
        artist: "AZKi",
        album: "",
        sing: "AZKi",
        tags: ["tag"],
        broadcast_at: "2024-01-05",
        video_title: "Video M1",
        milestones: ["first", "second"],
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        end: "",
        year: 0,
      },
    ];

    renderHook(() =>
      useStatistics({
        songs,
        coverSongInfo: mockCoverSongInfo,
        originalSongInfo: mockOriginalSongInfo,
      }),
    );

    const milestoneCall = createStatisticsMock.mock.calls.find(
      ([calledSongs, keyFn, sortFn, videoInfos]) =>
        calledSongs.length === 1 &&
        Array.isArray(keyFn(calledSongs[0])) &&
        (keyFn(calledSongs[0]) as string[]).includes("first") &&
        typeof sortFn === "function" &&
        !videoInfos,
    );

    expect(milestoneCall).toBeTruthy();

    const videoIdCall = createStatisticsMock.mock.calls.find(
      ([calledSongs, keyFn, sortFn, videoInfos]) =>
        calledSongs.length === 1 &&
        keyFn(calledSongs[0]) === "milestone-1" &&
        !sortFn &&
        !videoInfos,
    );

    expect(videoIdCall).toBeTruthy();

    const sortFn = milestoneCall?.[2] as (a: any, b: any) => number;
    const compareResult = sortFn(
      { lastVideo: { broadcast_at: "2024-02-01" } },
      { lastVideo: { broadcast_at: "2024-01-01" } },
    );
    expect(compareResult).toBeLessThan(0);
  });
});
