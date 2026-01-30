import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import useFavorites from "../useFavorites";
import type { Song } from "../../types/song";

describe("useFavorites", () => {
  const mockSong: Song = {
    video_id: "fav_vid_1",
    start: "0",
    title: "Fav Song 1",
    artist: "Artist",
    album: "Album",
    sing: "AZKi",
    tags: ["tag"],
    broadcast_at: "2024-01-01",
    video_title: "Video",
    album_list_uri: "",
    album_release_at: "",
    album_is_compilation: false,
    video_uri: "",
  };

  const mockSong2: Song = { ...mockSong, video_id: "fav_vid_2", start: "10" };
  const mockSong3: Song = { ...mockSong, video_id: "fav_vid_3", start: "20" };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("初期状態は空配列", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("お気に入りに追加できる", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.addToFavorites(mockSong));
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].videoId).toBe(mockSong.video_id);
  });

  it("重複追加は無視される", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.addToFavorites(mockSong));
    act(() => result.current.addToFavorites(mockSong));
    expect(result.current.favorites).toHaveLength(1);
  });

  it("isInFavorites と toggleFavorite が動作する", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isInFavorites(mockSong)).toBe(false);
    act(() => result.current.toggleFavorite(mockSong));
    expect(result.current.isInFavorites(mockSong)).toBe(true);
    act(() => result.current.toggleFavorite(mockSong));
    expect(result.current.isInFavorites(mockSong)).toBe(false);
  });

  it("削除できる", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.addToFavorites(mockSong));
    expect(result.current.favorites).toHaveLength(1);
    act(() => result.current.removeFromFavorites(mockSong));
    expect(result.current.favorites).toHaveLength(0);
  });

  it("複数追加して並び替えできる", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addToFavorites(mockSong);
      result.current.addToFavorites(mockSong2);
      result.current.addToFavorites(mockSong3);
    });

    expect(result.current.favorites.map((f) => f.videoId)).toEqual([
      "fav_vid_1",
      "fav_vid_2",
      "fav_vid_3",
    ]);

    const reordered = [
      { videoId: "fav_vid_3", start: "20" },
      { videoId: "fav_vid_1", start: "0" },
      { videoId: "fav_vid_2", start: "10" },
    ];

    act(() => result.current.reorderFavorites(reordered));

    expect(result.current.favorites.map((f) => f.videoId)).toEqual([
      "fav_vid_3",
      "fav_vid_1",
      "fav_vid_2",
    ]);
  });

  it("複数削除と全削除が動作する", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.addToFavorites(mockSong);
      result.current.addToFavorites(mockSong2);
      result.current.addToFavorites(mockSong3);
    });

    expect(result.current.favorites).toHaveLength(3);

    act(() =>
      result.current.removeMultipleFavorites([
        { videoId: mockSong.video_id, start: mockSong.start },
        { videoId: mockSong2.video_id, start: mockSong2.start },
      ]),
    );

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].videoId).toBe(mockSong3.video_id);

    act(() => result.current.clearAllFavorites());
    expect(result.current.favorites).toHaveLength(0);
  });
});
