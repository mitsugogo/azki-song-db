import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import usePlayerLifecycle from "../usePlayerLifecycle";

const createMockPlayer = () => {
  let currentTime = 0;
  return {
    getDuration: vi.fn(() => 120),
    getCurrentTime: vi.fn(() => currentTime),
    getVolume: vi.fn(() => 50),
    setVolume: vi.fn(),
    seekTo: vi.fn(),
    __setCurrentTime: (time: number) => {
      currentTime = time;
    },
  };
};

describe("usePlayerLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handlePlayerOnReadyで初期化と復元が行われる", () => {
    const originalHandlePlayerOnReady = vi.fn();
    const originalHandleStateChange = vi.fn();
    const applyPersistedVolume = vi.fn();
    const globalPlayer = {
      currentTime: 12,
      setCurrentTime: vi.fn(),
      setCurrentSong: vi.fn(),
    };

    const player = createMockPlayer();
    const playerRef = { current: null as any };

    const { result } = renderHook(() =>
      usePlayerLifecycle({
        originalHandlePlayerOnReady,
        originalHandleStateChange,
        globalPlayer,
        currentSong: { video_id: "vid1" },
        isPlaying: false,
        applyPersistedVolume,
        playerRef,
      }),
    );

    act(() => {
      result.current.setPreviousVideoId("vid1");
    });

    act(() => {
      result.current.handlePlayerOnReady({ target: player } as any);
    });

    expect(originalHandlePlayerOnReady).toHaveBeenCalled();
    expect(applyPersistedVolume).toHaveBeenCalledWith(player);
    expect(result.current.isPlayerReady).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(player.seekTo).toHaveBeenCalledWith(12, true);
    expect(result.current.hasRestoredPosition).toBe(true);
  });

  it("handlePlayerStateChangeでスナップショットが更新される", () => {
    const originalHandlePlayerOnReady = vi.fn();
    const originalHandleStateChange = vi.fn();
    const globalPlayer = {
      currentTime: 0,
      setCurrentTime: vi.fn(),
      setCurrentSong: vi.fn(),
    };

    const player = createMockPlayer();
    player.getDuration.mockReturnValue(200);
    player.__setCurrentTime(25);

    const { result } = renderHook(() =>
      usePlayerLifecycle({
        originalHandlePlayerOnReady,
        originalHandleStateChange,
        globalPlayer,
        currentSong: { video_id: "vid1" },
        isPlaying: false,
      }),
    );

    act(() => {
      result.current.handlePlayerStateChange({ target: player } as any);
    });

    expect(originalHandleStateChange).toHaveBeenCalled();
    expect(result.current.playerDuration).toBe(200);
    expect(result.current.playerCurrentTime).toBe(25);
  });

  it("再生中は現在時刻が同期される", () => {
    const originalHandlePlayerOnReady = vi.fn();
    const originalHandleStateChange = vi.fn();
    const globalPlayer = {
      currentTime: 0,
      setCurrentTime: vi.fn(),
      setCurrentSong: vi.fn(),
    };

    const player = createMockPlayer();
    const playerRef = { current: null as any };

    const { result, rerender } = renderHook(
      (props) => usePlayerLifecycle(props),
      {
        initialProps: {
          originalHandlePlayerOnReady,
          originalHandleStateChange,
          globalPlayer,
          currentSong: { video_id: "vid1" },
          isPlaying: false,
          playerRef,
        },
      },
    );

    act(() => {
      result.current.handlePlayerOnReady({ target: player } as any);
    });

    rerender({
      originalHandlePlayerOnReady,
      originalHandleStateChange,
      globalPlayer,
      currentSong: { video_id: "vid1" },
      isPlaying: true,
      playerRef,
    });

    act(() => {
      player.__setCurrentTime(1);
      vi.advanceTimersByTime(500);
    });

    expect(result.current.playerCurrentTime).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(globalPlayer.setCurrentTime).toHaveBeenCalledWith(1);
  });

  it("currentSongがnullの場合はグローバルをリセットする", () => {
    const originalHandlePlayerOnReady = vi.fn();
    const originalHandleStateChange = vi.fn();
    const globalPlayer = {
      currentTime: 0,
      setCurrentTime: vi.fn(),
      setCurrentSong: vi.fn(),
    };

    renderHook(() =>
      usePlayerLifecycle({
        originalHandlePlayerOnReady,
        originalHandleStateChange,
        globalPlayer,
        currentSong: null,
        isPlaying: false,
      }),
    );

    expect(globalPlayer.setCurrentSong).toHaveBeenCalledWith(null);
  });
});
