import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlobalPlayerProvider, useGlobalPlayer } from "../useGlobalPlayer";
import { ReactNode } from "react";
import { Song } from "../../types/song";

const mockSong: Song = {
  video_id: "test-id",
  title: "Test Song",
  artist: "Test Artist",
  album: "Test Album",
  sing: "Test Singer",
  tags: ["test"],
  video_title: "Test Video",
  broadcast_at: "2025-01-01",
  start: 0,
  end: 100,
  year: 2025,
  extra: "",
};

describe("useGlobalPlayer", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GlobalPlayerProvider>{children}</GlobalPlayerProvider>
  );

  it("プロバイダーの外で使用するとエラーをスローする", () => {
    // エラーハンドリングのためコンソールエラーを抑制
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGlobalPlayer());
    }).toThrow("useGlobalPlayer must be used within a GlobalPlayerProvider");

    spy.mockRestore();
  });

  it("初期状態が正しく設定される", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isMinimized).toBe(false);
    expect(result.current.currentTime).toBe(0);
  });

  it("currentSongを設定できる", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    act(() => {
      result.current.setCurrentSong(mockSong);
    });

    expect(result.current.currentSong).toEqual(mockSong);
  });

  it("isPlayingを設定できる", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    act(() => {
      result.current.setIsPlaying(true);
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.setIsPlaying(false);
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("isMinimizedを設定できる", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    act(() => {
      result.current.setIsMinimized(true);
    });

    expect(result.current.isMinimized).toBe(true);

    act(() => {
      result.current.setIsMinimized(false);
    });

    expect(result.current.isMinimized).toBe(false);
  });

  it("currentTimeを設定できる", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    act(() => {
      result.current.setCurrentTime(42);
    });

    expect(result.current.currentTime).toBe(42);
  });

  it("minimizePlayerが正しく動作する", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    act(() => {
      result.current.minimizePlayer();
    });

    expect(result.current.isMinimized).toBe(true);
  });

  it("maximizePlayerが正しく動作する", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    // まずミニマイズ
    act(() => {
      result.current.minimizePlayer();
    });

    expect(result.current.isMinimized).toBe(true);

    // マキシマイズ
    act(() => {
      result.current.maximizePlayer();
    });

    expect(result.current.isMinimized).toBe(false);
  });

  it("複数の状態を同時に設定できる", () => {
    const { result } = renderHook(() => useGlobalPlayer(), { wrapper });

    act(() => {
      result.current.setCurrentSong(mockSong);
      result.current.setIsPlaying(true);
      result.current.setCurrentTime(30);
      result.current.minimizePlayer();
    });

    expect(result.current.currentSong).toEqual(mockSong);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTime).toBe(30);
    expect(result.current.isMinimized).toBe(true);
  });
});
