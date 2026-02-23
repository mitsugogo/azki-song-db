import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import useSearch from "../useSearch";
import { Song } from "../../types/song";
import { useSearchParams } from "next/navigation";

const decodePlaylistUrlParamMock = vi.fn();

// モック
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("../usePlaylists", () => ({
  default: () => ({
    decodePlaylistUrlParam: decodePlaylistUrlParamMock,
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
      start: "0",
      end: "180",
      year: 2025,
      extra: "",
      milestones: ["100万人"],
      lyricist: "さくし1",
      composer: "さっきょく1",
      arranger: "あれんじゃー1",
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      video_uri: "",
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
      start: "0",
      end: "200",
      year: 2024,
      extra: "",
      lyricist: "さくし2",
      composer: "さっきょく2",
      arranger: "あれんじゃー2",
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      video_uri: "",
      milestones: [],
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
      start: "0",
      end: "150",
      year: 2024,
      extra: "",
      lyricist: "さくし3",
      composer: "さっきょく3",
      arranger: "あれんじゃー3",
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      video_uri: "",
      milestones: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue({
      get: vi.fn(() => null),
    });
  });

  it("初期状態では全ての曲を返す", () => {
    const { result } = renderHook(() =>
      useSearch(mockSongs, { syncUrl: true, urlUpdateMode: "push" }),
    );

    expect(result.current.songs).toEqual(mockSongs);
  });

  it("タイトル検索が動作する", async () => {
    const { result } = renderHook(() =>
      useSearch(mockSongs, { syncUrl: true, urlUpdateMode: "push" }),
    );

    result.current.setSearchTerm("title:winter");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].title).toBe("Winter Song");
      },
      { timeout: 1000 },
    );
  });

  it.each([
    { term: "title:Test Song", expect: 2 },
    { term: "title:Test Song 1", expect: 1 },
  ])(
    "タイトルにスペースが含まれていても動作する",
    async ({ term, expect: expectedCount }) => {
      const { result } = renderHook(() => useSearch(mockSongs));

      result.current.setSearchTerm(term);

      await waitFor(
        () => {
          expect(result.current.songs.length).toBe(expectedCount);
        },
        { timeout: 1000 },
      );
    },
  );

  it("アーティスト検索が動作する", async () => {
    const { result } = renderHook(() =>
      useSearch(mockSongs, { syncUrl: true, urlUpdateMode: "push" }),
    );

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

  it("アルバム検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("album:Album Y");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].album).toBe("Album Y");
      },
      { timeout: 1000 },
    );
  });

  it("作曲者検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("composer:さっきょく1");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
      },
      { timeout: 1000 },
    );
  });

  it("作詞者検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("lyricist:さくし1");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
      },
      { timeout: 1000 },
    );
  });

  it("編曲者検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("arranger:あれんじゃー1");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
      },
      { timeout: 1000 },
    );
  });

  it("動画タイトル検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("video_title:Video 2");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].video_title).toBe("Video 2");
      },
      { timeout: 1000 },
    );
  });

  it("動画ID検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("video_id:vid3");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].video_id).toBe("vid3");
      },
      { timeout: 1000 },
    );
  });

  it("ユニット検索が動作する", async () => {
    const songs: Song[] = [
      {
        video_id: "vid1",
        title: "Song 1",
        artist: "AZKi、星街すいせい",
        album: "Album 1",
        sing: "AZKi、星街すいせい",
        tags: [],
        video_title: "Video 1",
        broadcast_at: "2024-01-01",
        start: "0",
        end: "100",
        year: 2024,
        extra: "",
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        milestones: [],
      },
      {
        video_id: "vid2",
        title: "Song 2",
        artist: "AZKi、風真いろは",
        album: "Album 2",
        sing: "AZKi、風真いろは",
        tags: [],
        video_title: "Video 2",
        broadcast_at: "2024-01-02",
        start: "0",
        end: "100",
        year: 2024,
        extra: "",
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        milestones: [],
      },
    ];
    const { result } = renderHook(() => useSearch(songs));

    result.current.setSearchTerm("unit:AS_tar");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].sing).toBe("AZKi、星街すいせい");
      },
      { timeout: 1000 },
    );

    result.current.setSearchTerm("unit:あずいろ");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].sing).toBe("AZKi、風真いろは");
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

  it("除外検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("artist:artist|a|-title:winter");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(2);
        expect(result.current.songs[0].title).toBe("Test Song 1");
      },
      { timeout: 1000 },
    );
  });

  it("日付検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("date:2025/1/15");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].title).toBe("Test Song 1");
      },
      { timeout: 1000 },
    );
  });

  it("マイルストーン指定検索が動作する", async () => {
    const { result } = renderHook(() => useSearch(mockSongs));

    result.current.setSearchTerm("milestone:100万人");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].video_id).toBe("vid1");
      },
      { timeout: 1000 },
    );
  });

  it("プレイリストパラメータで並び順が維持される", async () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn((key: string) => (key === "playlist" ? "pl1" : null)),
    });

    decodePlaylistUrlParamMock.mockReturnValue({
      songs: [
        { videoId: "vid2", start: 0 },
        { videoId: "vid1", start: 0 },
      ],
    });

    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      href: "http://localhost/?playlist=pl1",
      search: "?playlist=pl1",
    } as Location;

    const { result } = renderHook(() => useSearch(mockSongs));

    await waitFor(
      () => {
        expect(result.current.songs[0].video_id).toBe("vid2");
        expect(result.current.songs[1].video_id).toBe("vid1");
      },
      { timeout: 1000 },
    );

    window.location = originalLocation as any;
  });

  it("オリ曲モードが動作する", async () => {
    const songs: Song[] = [
      {
        video_id: "orig1",
        title: "Original 1",
        artist: "AZKi",
        album: "",
        sing: "AZKi",
        tags: ["オリ曲"],
        video_title: "",
        broadcast_at: "2024-01-01",
        start: "0",
        end: "100",
        year: 2024,
        extra: "",
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        milestones: [],
      },
      {
        video_id: "cover1",
        title: "Cover 1",
        artist: "AZKi",
        album: "",
        sing: "AZKi",
        tags: ["カバー"],
        video_title: "",
        broadcast_at: "2024-01-02",
        start: "0",
        end: "100",
        year: 2024,
        extra: "",
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        milestones: [],
      },
    ];

    const { result } = renderHook(() => useSearch(songs));

    result.current.setSearchTerm("original-songs");

    await waitFor(
      () => {
        expect(result.current.songs.length).toBe(1);
        expect(result.current.songs[0].video_id).toBe("orig1");
      },
      { timeout: 1000 },
    );
  });

  it("楽曲紹介shortsは日付昇順で並ぶ", async () => {
    const songs: Song[] = [
      {
        video_id: "shorts1",
        title: "Shorts 1",
        artist: "AZKi",
        album: "",
        sing: "AZKi",
        tags: ["楽曲紹介shorts"],
        video_title: "",
        broadcast_at: "2024-02-01",
        start: "0",
        end: "100",
        year: 2024,
        extra: "",
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        milestones: [],
      },
      {
        video_id: "shorts2",
        title: "Shorts 2",
        artist: "AZKi",
        album: "",
        sing: "AZKi",
        tags: ["楽曲紹介shorts"],
        video_title: "",
        broadcast_at: "2024-01-15",
        start: "0",
        end: "100",
        year: 2024,
        extra: "",
        lyricist: "",
        composer: "",
        arranger: "",
        album_list_uri: "",
        album_release_at: "",
        album_is_compilation: false,
        video_uri: "",
        milestones: [],
      },
    ];

    const { result } = renderHook(() => useSearch(songs));

    result.current.setSearchTerm("tag:楽曲紹介shorts");

    await waitFor(
      () => {
        expect(result.current.songs[0].video_id).toBe("shorts2");
        expect(result.current.songs[1].video_id).toBe("shorts1");
      },
      { timeout: 1000 },
    );
  });

  it("検索語変更でURLが更新される", async () => {
    const pushStateSpy = vi
      .spyOn(window.history, "pushState")
      .mockImplementation(() => undefined as any);
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    window.history.replaceState(null, "", window.location.pathname);

    const { result } = renderHook(() =>
      useSearch(mockSongs, { syncUrl: true, urlUpdateMode: "push" }),
    );

    result.current.setSearchTerm("artist:artist a");

    await waitFor(
      () => {
        expect(pushStateSpy).toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      },
      { timeout: 1000 },
    );

    pushStateSpy.mockRestore();
    dispatchSpy.mockRestore();
  });
});
