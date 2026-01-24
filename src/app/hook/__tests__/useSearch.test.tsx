import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import useSearch from "../useSearch";
import { Song } from "../../types/song";
import { useSearchParams } from "next/navigation";

// モック
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("../usePlaylists", () => ({
  default: () => ({
    decodePlaylistUrlParam: vi.fn(),
  }),
}));

describe("useSearch", () => {
  const mockSongs: Song[] = [
    {
      video_id: "vid1",
      title: "Test Song 1",
      artist: "Artist A",
      album: "Album X",
      sing: "Singer 1",
      tags: ["オリ曲", "ロック"],
      video_title: "Video 1",
      broadcast_at: "2025-01-15",
      start: 0,
      end: 180,
      year: 2025,
      extra: "",
      milestones: ["100万人"],
    },
    {
      video_id: "vid2",
      title: "Test Song 2",
      artist: "Artist B",
      album: "Album Y",
      sing: "AZKi",
      tags: ["カバー"],
      video_title: "Video 2",
      broadcast_at: "2024-06-20",
      start: 0,
      end: 200,
      year: 2024,
      extra: "",
    },
    {
      video_id: "vid3",
      title: "Winter Song",
      artist: "Artist A",
      album: "Album Z",
      sing: "Singer 2",
      tags: ["オリ曲"],
      video_title: "Video 3",
      broadcast_at: "2024-12-25",
      start: 0,
      end: 150,
      year: 2024,
      extra: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue({
      get: vi.fn(() => null),
    });
  });

  it("初期状態では全ての曲を返す", () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    expect(result.current.songs).toEqual(mockSongs);
  });

  it("タイトル検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("title:winter");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].title).toBe("Winter Song");
      },
      { timeout: 1000 },
    );
  });

  it("アーティスト検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("artist:artist a");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBeGreaterThanOrEqual(2);
        expect(result.current.songs.some((s) => s.artist === "Artist A")).toBe(
          true,
        );
      },
      { timeout: 1000 },
    );
  });

  it("タグ検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("tag:オリ曲");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(2);
        expect(
          result.current.songs.every((s) => s.tags.includes("オリ曲")),
        ).toBe(true);
      },
      { timeout: 1000 },
    );
  });

  it("年検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("year:2025");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].year).toBe(2025);
      },
      { timeout: 1000 },
    );
  });

  it("季節検索（冬）が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("season:冬");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(2); // 1月と12月の曲
      },
      { timeout: 1000 },
    );
  });

  it("マイルストーン検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("milestone:*");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].milestones).toBeDefined();
        expect(result.current.songs[0].milestones!.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );
  });

  it("複数条件（AND検索）が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("tag:オリ曲|year:2024");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].title).toBe("Winter Song");
      },
      { timeout: 1000 },
    );
  });

  it("歌った人検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("sing:AZKi");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].sing).toContain("AZKi");
      },
      { timeout: 1000 },
    );
  });

  it("検索語が空の場合は全ての曲を返す", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("");

    await waitFor(
      () => {
        expect(result.current.songs).toEqual(mockSongs);
      },
      { timeout: 1000 },
    );
  });

  it("検索がデバウンスされる", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    // 短時間に複数回検索語を変更
    result.current.setSearchTerm("year:2024");
    result.current.setSearchTerm("year:2025");

    // 即座には反映されない
    expect(result.current.songs).toEqual(mockSongs);

    // デバウンス後に最後の検索語が反映される
    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].year).toBe(2025);
      },
      { timeout: 1000 },
    );
  });
});
