import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import useMainPlayerControls from "../useMainPlayerControls";
import type { Song } from "../../types/song";
import type { GlobalPlayerContextType } from "../useGlobalPlayer";

// モック用のglobalPlayerを作成
const createMockGlobalPlayer = (): GlobalPlayerContextType => ({
  currentSong: null,
  isPlaying: false,
  isMinimized: false,
  currentTime: 0,
  setCurrentSong: vi.fn(),
  setIsPlaying: vi.fn(),
  setIsMinimized: vi.fn(),
  setCurrentTime: vi.fn(),
  minimizePlayer: vi.fn(),
  maximizePlayer: vi.fn(),
  seekTo: vi.fn(),
  setSeekTo: vi.fn(),
});

const createMockPlayer = () => ({
  getCurrentTime: vi.fn(() => 0),
  getDuration: vi.fn(() => 100),
  seekTo: vi.fn(),
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  setVolume: vi.fn(),
  mute: vi.fn(),
  unMute: vi.fn(),
});

describe("useMainPlayerControls", () => {
  const mockSongs: Song[] = [
    {
      video_id: "vid1",
      start: "0",
      end: "",
      title: "Song 1",
      artist: "Artist 1",
      album: "",
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      sing: "",
      video_title: "",
      video_uri: "",
      broadcast_at: "",
      year: 0,
      tags: [],
      milestones: [],
      lyricist: "",
      composer: "",
      arranger: "",
    },
    {
      video_id: "vid2",
      start: "10",
      end: "",
      title: "Song 2",
      artist: "Artist 2",
      album: "",
      album_list_uri: "",
      album_release_at: "",
      album_is_compilation: false,
      sing: "",
      video_title: "",
      video_uri: "",
      broadcast_at: "",
      year: 0,
      tags: [],
      milestones: [],
      lyricist: "",
      composer: "",
      arranger: "",
    },
  ];

  let mockGlobalPlayer: GlobalPlayerContextType;

  beforeEach(() => {
    mockGlobalPlayer = createMockGlobalPlayer();
    // localStorageをモック
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "player-volume") return "100";
      if (key === "player-muted") return "false";
      if (key === "hideFutureSongs") return "false";
      return null;
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初期状態が正しい", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playerControls.isReady).toBe(false);
    expect(result.current.playerControls.volume).toBe(100);
    expect(result.current.playerControls.isMuted).toBe(false);
  });

  it("handlePlayerOnReadyでプレイヤーが準備される", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    expect(result.current.playerControls.isReady).toBe(true);
  });

  it("キーボードイベントでシークできる", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();
    mockPlayer.getCurrentTime.mockReturnValue(50);

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    // 右キーを押す
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
      window.dispatchEvent(event);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(60, true);
    expect(mockGlobalPlayer.setCurrentTime).toHaveBeenCalledWith(60);

    // 左キーを押す
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
      window.dispatchEvent(event);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(40, true);
    expect(mockGlobalPlayer.setCurrentTime).toHaveBeenCalledWith(40);
  });

  it("INPUT要素ではキーボードイベントが無視される", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    // INPUT要素を作成
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // 右キーを押す
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
      Object.defineProperty(event, "target", { value: input });
      window.dispatchEvent(event);
    });

    expect(mockPlayer.seekTo).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("ボリューム変更が機能する", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    act(() => {
      result.current.playerControls.setVolume(50);
    });

    expect(mockPlayer.setVolume).toHaveBeenCalledWith(50);
    expect(result.current.playerControls.volume).toBe(50);
  });

  it("ミュート機能が機能する", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    act(() => {
      result.current.playerControls.mute();
    });

    expect(mockPlayer.mute).toHaveBeenCalled();
    expect(result.current.playerControls.isMuted).toBe(true);

    act(() => {
      result.current.playerControls.unMute();
    });

    expect(mockPlayer.unMute).toHaveBeenCalled();
    expect(result.current.playerControls.isMuted).toBe(false);
  });

  it("再生・一時停止が機能する", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    act(() => {
      result.current.playerControls.play();
    });

    expect(mockPlayer.playVideo).toHaveBeenCalled();

    act(() => {
      result.current.playerControls.pause();
    });

    expect(mockPlayer.pauseVideo).toHaveBeenCalled();
  });

  it("シーク機能が機能する", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    act(() => {
      result.current.playerControls.seekTo(75);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(75, true);
    expect(mockGlobalPlayer.setCurrentTime).toHaveBeenCalledWith(75);
  });
});
