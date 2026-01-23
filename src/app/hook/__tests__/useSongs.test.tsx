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

  it("曲データを取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allSongs).toHaveLength(3);
    expect(global.fetch).toHaveBeenCalledWith("/api/songs");
  });

  it("曲データが放送日時の降順でソートされる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const songs = result.current.allSongs;
    expect(songs[0].broadcast_at).toBe("2024-01-03");
    expect(songs[1].broadcast_at).toBe("2024-01-02");
    expect(songs[2].broadcast_at).toBe("2024-01-01");
  });

  it("利用可能なタグのリストが取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const tags = result.current.availableTags;
    expect(tags).toContain("オリ曲");
    expect(tags).toContain("カバー曲");
    expect(tags).toContain("tag1");
    expect(tags).toContain("tag2");
    expect(tags).toContain("tag3");
    // ソートされていることを確認
    expect(tags).toEqual([...tags].sort());
  });

  it("利用可能なアーティストのリストが取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const artists = result.current.availableArtists;
    expect(artists).toContain("Artist A");
    expect(artists).toContain("Artist B");
    expect(artists).toContain("Artist C");
    expect(artists).toEqual([...artists].sort());
  });

  it("利用可能な歌手のリストが取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const singers = result.current.availableSingers;
    expect(singers).toContain("AZKi");
    expect(singers).toContain("Guest");
    expect(singers).toEqual([...singers].sort());
  });

  it("利用可能な曲タイトルのリストが取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const titles = result.current.availableSongTitles;
    expect(titles).toContain("Song One");
    expect(titles).toContain("Song Two");
    // 重複が除去されている
    expect(titles.filter((t) => t === "Song One")).toHaveLength(1);
    expect(titles).toEqual([...titles].sort());
  });

  it("利用可能なマイルストーンのリストが取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const milestones = result.current.availableMilestones;
    expect(milestones).toContain("1st Live");
  });

  it("タイトルとアーティストの組み合わせリストが取得できる", async () => {
    const { result } = renderHook(() => useSongs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const titleAndArtists = result.current.availableTitleAndArtists;
    expect(titleAndArtists).toHaveLength(2); // Song One + Artist A, Song Two + Artist B、Artist C

    const songOne = titleAndArtists.find((ta) => ta.title === "Song One");
    expect(songOne).toBeDefined();
    expect(songOne?.artist).toBe("Artist A");

    const songTwo = titleAndArtists.find((ta) => ta.title === "Song Two");
    expect(songTwo).toBeDefined();
    expect(songTwo?.artist).toBe("Artist B、Artist C");
  });
});
