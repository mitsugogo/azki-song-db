import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import usePageTransition from "../usePageTransition";
import { usePathname } from "next/navigation";
import { useGlobalPlayer } from "../useGlobalPlayer";

// モック
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("../useGlobalPlayer", () => ({
  useGlobalPlayer: vi.fn(),
}));

describe("usePageTransition", () => {
  const mockMinimizePlayer = vi.fn();
  const mockCurrentSong = {
    video_id: "test-video-id",
    title: "Test Song",
    artist: "Test Artist",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: null,
      minimizePlayer: mockMinimizePlayer,
    });
  });

  it("初期レンダリングではミニプレイヤー化されない", () => {
    (usePathname as Mock).mockReturnValue("/");

    renderHook(() => usePageTransition());

    expect(mockMinimizePlayer).not.toHaveBeenCalled();
  });

  it("watchから別のページに遷移するとミニプレイヤー化される", () => {
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: mockCurrentSong,
      minimizePlayer: mockMinimizePlayer,
    });

    (usePathname as Mock).mockReturnValue("/watch");
    const { rerender } = renderHook(() => usePageTransition());

    (usePathname as Mock).mockReturnValue("/search");
    rerender();

    expect(mockMinimizePlayer).toHaveBeenCalledTimes(1);
  });

  it("watch以外からの遷移ではミニプレイヤー化されない", () => {
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: mockCurrentSong,
      minimizePlayer: mockMinimizePlayer,
    });

    (usePathname as Mock).mockReturnValue("/search");
    const { rerender } = renderHook(() => usePageTransition());

    (usePathname as Mock).mockReturnValue("/playlist");
    rerender();

    expect(mockMinimizePlayer).not.toHaveBeenCalled();
  });

  it("currentSongがnullの場合はミニプレイヤー化されない", () => {
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: null,
      minimizePlayer: mockMinimizePlayer,
    });

    (usePathname as Mock).mockReturnValue("/");
    const { rerender } = renderHook(() => usePageTransition());

    (usePathname as Mock).mockReturnValue("/search");
    rerender();

    expect(mockMinimizePlayer).not.toHaveBeenCalled();
  });
});
