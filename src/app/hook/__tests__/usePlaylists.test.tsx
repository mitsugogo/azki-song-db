import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import usePlaylists, { Playlist } from "../usePlaylists";
import type { Song } from "../../types/song";

describe("usePlaylists", () => {
  const mockSong: Song = {
    video_id: "test_video_id",
    start: "0",
    title: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    sing: "AZKi",
    tags: ["tag1"],
    broadcast_at: "2024-01-01",
    video_title: "Test Video",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "",
  };

  const mockPlaylist: Playlist = {
    name: "Test Playlist",
    songs: [
      {
        videoId: "test_video_id",
        start: "0",
      },
    ],
  };

  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("初期状態は空の配列", () => {
    const { result } = renderHook(() => usePlaylists());
    expect(result.current.playlists).toEqual([]);
  });

  it("プレイリストを保存できる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    expect(result.current.playlists).toHaveLength(1);
    expect(result.current.playlists[0].name).toBe("Test Playlist");
    expect(result.current.playlists[0].id).toBeDefined();
    expect(result.current.playlists[0].createdAt).toBeDefined();
    expect(result.current.playlists[0].updatedAt).toBeDefined();
  });

  it("曲がプレイリストに含まれているかチェックできる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const playlist = result.current.playlists[0];
    const isIn = result.current.isInPlaylist(playlist, mockSong);

    expect(isIn).toBe(true);
  });

  it("曲がプレイリストに含まれていない場合はfalseを返す", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const differentSong: Song = {
      ...mockSong,
      video_id: "different_id",
    };

    const playlist = result.current.playlists[0];
    const isIn = result.current.isInPlaylist(playlist, differentSong);

    expect(isIn).toBe(false);
  });

  it("いずれかのプレイリストに曲が含まれているかチェックできる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const isInAny = result.current.isInAnyPlaylist(mockSong);
    expect(isInAny).toBe(true);
  });

  it("どのプレイリストにも含まれていない場合はfalseを返す", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const differentSong: Song = {
      ...mockSong,
      video_id: "different_id",
    };

    const isInAny = result.current.isInAnyPlaylist(differentSong);
    expect(isInAny).toBe(false);
  });

  it("プレイリストに曲を追加できる", () => {
    const { result } = renderHook(() => usePlaylists());

    const emptyPlaylist: Playlist = {
      name: "Empty Playlist",
      songs: [],
    };

    act(() => {
      result.current.savePlaylist(emptyPlaylist);
    });

    const playlist = result.current.playlists[0];

    act(() => {
      result.current.addToPlaylist(playlist, mockSong);
    });

    const updatedPlaylist = result.current.playlists.find(
      (p) => p.name === "Empty Playlist",
    );

    expect(updatedPlaylist?.songs).toHaveLength(1);
    expect(updatedPlaylist?.songs[0].videoId).toBe(mockSong.video_id);
  });

  it("プレイリストから曲を削除できる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const playlist = result.current.playlists[0];

    act(() => {
      result.current.removeFromPlaylist(playlist, mockSong);
    });

    const updatedPlaylist = result.current.playlists.find(
      (p) => p.name === "Test Playlist",
    );

    expect(updatedPlaylist?.songs).toHaveLength(0);
  });

  it("プレイリストを削除できる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    expect(result.current.playlists).toHaveLength(1);

    const playlist = result.current.playlists[0];

    act(() => {
      result.current.deletePlaylist(playlist);
    });

    expect(result.current.playlists).toHaveLength(0);
  });

  it("プレイリストの名前を変更できる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const playlist = result.current.playlists[0];
    const newName = "Renamed Playlist";

    act(() => {
      result.current.renamePlaylist(playlist, newName);
    });

    const updatedPlaylist = result.current.playlists[0];
    expect(updatedPlaylist.name).toBe(newName);
  });

  it("プレイリストの曲を全てクリアできる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    const playlist = result.current.playlists[0];

    act(() => {
      result.current.clearAllSongs(playlist);
    });

    const updatedPlaylist = result.current.playlists[0];
    expect(updatedPlaylist.songs).toHaveLength(0);
  });

  it("プレイリスト名の重複をチェックできる", () => {
    const { result } = renderHook(() => usePlaylists());

    act(() => {
      result.current.savePlaylist(mockPlaylist);
    });

    expect(result.current.isDuplicate("Test Playlist")).toBe(true);
    expect(result.current.isDuplicate("Non-existent Playlist")).toBe(false);
  });

  it("プレイリストの最大曲数を取得できる", () => {
    const { result } = renderHook(() => usePlaylists());
    expect(result.current.getMaxLimit()).toBe(300);
  });

  it("プレイリストのエンコードとデコードが正しく動作する", () => {
    const { result } = renderHook(() => usePlaylists());

    const testPlaylist: Playlist = {
      id: "12345",
      name: "Test Encoded Playlist",
      songs: [
        { videoId: "vid1", start: "0" },
        { videoId: "vid2", start: "100" },
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      author: "Test Author",
    };

    const encoded = result.current.encodePlaylistUrlParam(testPlaylist);
    expect(encoded).toBeTruthy();

    const decoded = result.current.decodePlaylistUrlParam(encoded);
    expect(decoded.id).toBe(testPlaylist.id);
    expect(decoded.name).toBe(testPlaylist.name);
    expect(decoded.songs).toHaveLength(2);
    expect(decoded.songs[0].videoId).toBe("vid1");
    expect(decoded.songs[1].videoId).toBe("vid2");
  });
});
