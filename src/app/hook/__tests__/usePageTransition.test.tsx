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

  it("ホームページから別のページに遷移するとミニプレイヤー化される", () => {
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: mockCurrentSong,
      minimizePlayer: mockMinimizePlayer,
    });

    // 初期レンダリング: ホームページ
    (usePathname as Mock).mockReturnValue("/");
    const { rerender } = renderHook(() => usePageTransition());

    // pathnameの変更をシミュレート: ホームページから検索ページへ
    (usePathname as Mock).mockReturnValue("/search");
    rerender();

    expect(mockMinimizePlayer).toHaveBeenCalledTimes(1);
  });

  it("ホームページ以外からの遷移ではミニプレイヤー化されない", () => {
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: mockCurrentSong,
      minimizePlayer: mockMinimizePlayer,
    });

    // 初期状態: 検索ページ
    (usePathname as Mock).mockReturnValue("/search");
    renderHook(() => usePageTransition());

    // 遷移: 検索ページからプレイリストページへ
    (usePathname as Mock).mockReturnValue("/playlist");
    renderHook(() => usePageTransition());

    expect(mockMinimizePlayer).not.toHaveBeenCalled();
  });

  it("currentSongがnullの場合はミニプレイヤー化されない", () => {
    (useGlobalPlayer as Mock).mockReturnValue({
      currentSong: null,
      minimizePlayer: mockMinimizePlayer,
    });

    // 初期状態: ホームページ
    (usePathname as Mock).mockReturnValue("/");
    renderHook(() => usePageTransition());

    // 遷移: ホームページから検索ページへ
    (usePathname as Mock).mockReturnValue("/search");
    renderHook(() => usePageTransition());

    expect(mockMinimizePlayer).not.toHaveBeenCalled();
  });
});
