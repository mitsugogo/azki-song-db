import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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
    // タイマーをモック
    vi.stubGlobal(
      "setInterval",
      vi.fn((cb) => {
        cb();
        return 1;
      }),
    );
    vi.stubGlobal("clearInterval", vi.fn());
    vi.stubGlobal(
      "setTimeout",
      vi.fn((cb) => cb()),
    );
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

  it("曲を異なるvideoへ変更したときにplayerControls.isReadyがfalseになる", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      // 最初の曲を選択してプレイヤーを準備する
      result.current.changeCurrentSong(mockSongs[0]);
      result.current.handlePlayerOnReady({ target: mockPlayer } as any);
    });

    expect(result.current.playerControls.isReady).toBe(true);

    act(() => {
      // 異なるvideoに切り替える
      result.current.changeCurrentSong(mockSongs[1]);
    });

    expect(result.current.playerControls.isReady).toBe(false);
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

  it("連続して同一時刻へシークされた場合は重複を抑止する", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.handlePlayerOnReady({ target: mockPlayer } as any);
    });

    act(() => {
      // 連続して同じ位置へシーク要求を出す
      result.current.playerControls.seekTo(50);
      result.current.playerControls.seekTo(50);
    });

    // 実プレイヤーへの seekTo 呼び出しは 1 回だけに抑止される
    expect(mockPlayer.seekTo).toHaveBeenCalledTimes(1);
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(50, true);
  });

  it("currentSongがnullの場合、globalPlayerがリセットされる", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: [],
        allSongs: [],
        globalPlayer: mockGlobalPlayer,
      }),
    );

    expect(result.current.currentSong).toBeNull();
    expect(mockGlobalPlayer.setCurrentSong).toHaveBeenCalledWith(null);
  });

  it("video_idが変更された場合、再生位置がリセットされる", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    // 最初の曲を設定
    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    // 明示的に別動画の曲へ切り替え
    act(() => {
      result.current.changeCurrentSong(mockSongs[1]);
    });

    expect(mockGlobalPlayer.setCurrentTime).toHaveBeenCalledWith(0);
  });

  it("キーボードイベントでgetDurationが機能しない場合の境界チェック", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();
    mockPlayer.getCurrentTime.mockReturnValue(90);
    mockPlayer.getDuration.mockReturnValue(NaN); // NaNを返す

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    // playerDuration を設定するために updatePlayerSnapshot をシミュレート
    mockPlayer.getDuration.mockReturnValue(100);
    act(() => {
      // 何らかのトリガーで updatePlayerSnapshot が呼ばれる
      result.current.handlePlayerStateChange({
        target: mockPlayer,
      } as any);
    });

    // 右キーを押す（100秒を超えないように）
    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
      window.dispatchEvent(event);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(100, true);
  });

  it("ボリューム変更時にミュートが解除される", () => {
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

    // ミュート状態にする
    act(() => {
      result.current.playerControls.mute();
    });

    expect(result.current.playerControls.isMuted).toBe(true);

    // ボリュームを上げる
    act(() => {
      result.current.playerControls.setVolume(50);
    });

    expect(mockPlayer.unMute).toHaveBeenCalled();
    expect(result.current.playerControls.isMuted).toBe(false);
  });

  it("ボリュームを0にするとミュートされ、永続化される", () => {
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
      result.current.playerControls.setVolume(0);
    });

    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0);
    expect(mockPlayer.mute).toHaveBeenCalled();
    expect(result.current.playerControls.isMuted).toBe(true);
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      "player-muted",
      "true",
    );
  });

  it("プレイヤーが準備されていない場合、操作が無視される", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    // プレイヤーが準備されていない状態で操作
    act(() => {
      result.current.playerControls.setVolume(50);
    });

    expect(result.current.playerControls.volume).toBe(100); // 変更されない
  });

  it("シーク時の境界チェック（playerDurationを使用）", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();
    mockPlayer.getDuration.mockReturnValue(NaN);

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    // playerDuration を設定
    mockPlayer.getDuration.mockReturnValue(100);
    act(() => {
      result.current.handlePlayerStateChange({
        target: mockPlayer,
      } as any);
    });

    // 境界を超えたシーク
    act(() => {
      result.current.playerControls.seekTo(150); // 100秒を超える
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(100, true); // playerDurationで制限
  });

  it("再生位置の復元が機能する", () => {
    const mockGlobalPlayerWithTime = {
      ...mockGlobalPlayer,
      currentTime: 50,
    };

    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayerWithTime,
      }),
    );

    const mockPlayer = createMockPlayer();

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    // 同じビデオIDで再度準備（previousVideoId を設定）
    act(() => {
      result.current.setPreviousVideoId(mockSongs[0].video_id);
    });

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(50, true);
  });

  it("isPlayingがtrueの場合、時間更新のインターバルが実行される", () => {
    const { result } = renderHook(() =>
      useMainPlayerControls({
        songs: mockSongs,
        allSongs: mockSongs,
        globalPlayer: mockGlobalPlayer,
      }),
    );

    const mockPlayer = createMockPlayer();
    mockPlayer.getCurrentTime.mockReturnValue(10);

    act(() => {
      result.current.handlePlayerOnReady({
        target: mockPlayer,
      } as any);
    });

    // 再生を開始
    act(() => {
      result.current.playerControls.play();
    });

    expect(result.current.isPlaying).toBe(true);

    expect(mockGlobalPlayer.setCurrentTime).toHaveBeenCalledWith(10);
  });

  it("キーボードイベントでのsetCurrentTimeのエラーハンドリング", () => {
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
  });
});
