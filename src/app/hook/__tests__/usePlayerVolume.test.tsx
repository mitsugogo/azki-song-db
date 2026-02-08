import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import usePlayerVolume, {
  applyPersistedVolumeToPlayer,
} from "../usePlayerVolume";

describe("usePlayerVolume", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("changeVolumeで音量がクランプされる", () => {
    const playerRef = {
      current: {
        setVolume: vi.fn(),
      },
    };

    const { result } = renderHook(() => usePlayerVolume(playerRef, true));

    act(() => {
      result.current.changeVolume(120);
    });

    expect(playerRef.current.setVolume).toHaveBeenCalledWith(100);
    expect(result.current.playerVolume).toBe(100);
    expect(localStorage.getItem("player-volume")).toBe("100");
  });

  it("未準備のときはchangeVolumeが動作しない", () => {
    const playerRef = {
      current: {
        setVolume: vi.fn(),
      },
    };

    const { result } = renderHook(() => usePlayerVolume(playerRef, false));

    act(() => {
      result.current.changeVolume(50);
    });

    expect(playerRef.current.setVolume).not.toHaveBeenCalled();
  });

  it("applyPersistedVolumeで保存済み音量を適用できる", () => {
    localStorage.setItem("player-volume", "42");

    const playerRef = {
      current: {
        setVolume: vi.fn(),
      },
    };

    const { result } = renderHook(() => usePlayerVolume(playerRef, true));

    act(() => {
      result.current.applyPersistedVolume(playerRef.current);
    });

    expect(playerRef.current.setVolume).toHaveBeenCalledWith(42);
    expect(result.current.playerVolume).toBe(42);
  });

  it("applyPersistedVolumeToPlayerが数値を適用する", () => {
    localStorage.setItem("player-volume", "55");

    const playerInstance = {
      setVolume: vi.fn(),
    };

    applyPersistedVolumeToPlayer(playerInstance);

    expect(playerInstance.setVolume).toHaveBeenCalledWith(55);
  });
});
