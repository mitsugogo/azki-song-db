import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { usePlaylistActions } from "../usePlaylistActions";
import type { Song } from "../../types/song";
import type { Playlist } from "../usePlaylists";

// usePlaylistsをモック
vi.mock("../usePlaylists", () => ({
  default: () => ({
    isInPlaylist: vi.fn((playlist, song) => {
      return playlist.songs.some(
        (entry: any) =>
          entry.videoId === song.video_id && entry.start === song.start,
      );
    }),
    encodePlaylistUrlParam: vi.fn((playlist) => "encoded_playlist_data"),
    decodePlaylistUrlParam: vi.fn((param) => ({
      id: "1",
      name: "Decoded Playlist",
      songs: [{ videoId: "test1", start: "0" }],
    })),
  }),
}));

describe("usePlaylistActions", () => {
  const mockSongs: Song[] = [
    {
      video_id: "test1",
      start: "0",
      title: "Song One",
      artist: "Artist A",
      album: "Album X",
      sing: "AZKi",
      tags: ["tag1"],
      broadcast_at: "2024-01-01",
      video_title: "Video One",
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
      tags: ["tag2"],
      broadcast_at: "2024-01-02",
      video_title: "Video Two",
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      video_uri: "",
      end: "",
      year: 0,
      milestones: [],
    },
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
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      video_uri: "",
      end: "",
      year: 0,
      milestones: [],
    },
  ];

  const mockPlaylist: Playlist = {
    id: "1",
    name: "Test Playlist",
    songs: [
      { videoId: "test1", start: "0" },
      { videoId: "test3", start: "0" },
    ],
  };

  let mockSetSongs: ReturnType<typeof vi.fn>;
  let mockChangeCurrentSong: ReturnType<typeof vi.fn>;
  let mockSetSearchTerm: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    mockSetSongs = vi.fn();
    mockChangeCurrentSong = vi.fn();
    mockSetSearchTerm = vi.fn();

    // window.locationをモック
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000",
    } as Location;

    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location = originalLocation as any;
  });

  it("プレイリストを再生できる", () => {
    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    act(() => {
      result.current.playPlaylist(mockPlaylist);
    });

    expect(mockSetSongs).toHaveBeenCalled();
    expect(mockChangeCurrentSong).toHaveBeenCalled();
    expect(mockSetSearchTerm).toHaveBeenCalledWith("");
  });

  it("プレイリストモードを無効化できる", () => {
    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    act(() => {
      result.current.disablePlaylistMode();
    });

    expect(mockSetSongs).toHaveBeenCalledWith(mockSongs);
  });

  it("URLからプレイリストをデコードできる", () => {
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000?playlist=encoded_data",
    } as Location;

    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    const decodedPlaylist = result.current.decodePlaylistFromUrl();

    expect(decodedPlaylist).toBeDefined();
    expect(decodedPlaylist?.name).toBe("Decoded Playlist");
  });

  it("URLにプレイリストパラメータがない場合はnullを返す", () => {
    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    const decodedPlaylist = result.current.decodePlaylistFromUrl();

    expect(decodedPlaylist).toBeNull();
  });

  it("isInPlaylist関数が正しく動作する", () => {
    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    const isIn = result.current.isInPlaylist(mockPlaylist, mockSongs[0]);
    expect(isIn).toBe(true);

    const isNotIn = result.current.isInPlaylist(mockPlaylist, mockSongs[1]);
    expect(isNotIn).toBe(false);
  });

  it("プレイリスト再生時にURLが更新される", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    act(() => {
      result.current.playPlaylist(mockPlaylist);
    });

    expect(replaceStateSpy).toHaveBeenCalled();

    replaceStateSpy.mockRestore();
  });

  it("プレイリスト無効化時にURLからプレイリストパラメータが削除される", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const { result } = renderHook(() =>
      usePlaylistActions({
        allSongs: mockSongs,
        setSongs: mockSetSongs,
        changeCurrentSong: mockChangeCurrentSong,
        setSearchTerm: mockSetSearchTerm,
      }),
    );

    act(() => {
      result.current.disablePlaylistMode();
    });

    expect(replaceStateSpy).toHaveBeenCalled();

    replaceStateSpy.mockRestore();
  });
});
