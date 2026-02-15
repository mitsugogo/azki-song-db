import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import useControlBar from "../useControlBar";
import type { Song } from "../../types/song";

const songA: Song = {
  title: "A",
  artist: "Artist",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "",
  video_title: "",
  video_uri: "",
  video_id: "vidX",
  start: "0",
  end: "30",
  broadcast_at: "",
  year: 0,
  tags: [],
  milestones: [],
};
const songB: Song = { ...songA, start: "30", title: "B" };

describe("useControlBar (seek behavior)", () => {
  it("currentSong変更時にtempSeekValueがdisplayCurrentTimeへ同期される", async () => {
    const mockPlayerControls = {
      isReady: true,
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      currentTime: 42,
      seekInFlight: null,
      volume: 100,
      duration: 600,
      isMuted: false,
    } as any;

    const { result, rerender } = renderHook(
      ({ cs }) =>
        useControlBar({
          allSongs: [songA, songB],
          currentSong: cs,
          nextSong: songB,
          isPlaying: false,
          playerControls: mockPlayerControls,
          changeCurrentSong: () => {},
        }),
      { initialProps: { cs: songA } },
    );

    // now simulate selecting a different song (user action)
    rerender({ cs: songB });

    // tempSeekValue should reflect displayCurrentTime (cumulative mapping for songsInVideo)
    // with provided mock songs the cumulative duration caps at 30s so expect 30
    await waitFor(() => {
      expect(result.current.tempSeekValue).toBe(30);
    });
  });

  it("ドラッグ中はseekせず、handleSeekEndでseekが実行される", () => {
    const mockPlayerControls = {
      isReady: true,
      play: () => {},
      pause: () => {},
      seekTo: vi.fn(),
      setVolume: () => {},
      currentTime: 0,
      seekInFlight: null,
      volume: 100,
      duration: 600,
      isMuted: false,
    } as any;

    const { result } = renderHook(() =>
      useControlBar({
        allSongs: [songA, songB],
        currentSong: songA,
        nextSong: songB,
        isPlaying: false,
        playerControls: mockPlayerControls,
        changeCurrentSong: () => {},
      }),
    );

    // dragging中はseekしない
    act(() => {
      result.current.handleSeekChange(12);
    });
    expect(mockPlayerControls.seekTo).not.toHaveBeenCalled();

    // 確定時にseekが走る
    act(() => {
      result.current.handleSeekEnd(12);
    });
    expect(mockPlayerControls.seekTo).toHaveBeenCalledTimes(1);
  });

  it("異なる動画の次へ操作ではseekは呼ばれず changeCurrentSong のみ行われる", () => {
    const mockChangeCurrentSong = vi.fn();
    const differentSong: Song = { ...songB, video_id: "vidY", start: "10" };

    const mockPlayerControls = {
      isReady: true,
      play: () => {},
      pause: () => {},
      seekTo: vi.fn(),
      setVolume: () => {},
      currentTime: 0,
      seekInFlight: null,
      volume: 100,
      duration: 600,
      isMuted: false,
    } as any;

    const { result } = renderHook(() =>
      useControlBar({
        allSongs: [songA, differentSong],
        currentSong: songA,
        nextSong: differentSong,
        isPlaying: false,
        playerControls: mockPlayerControls,
        changeCurrentSong: mockChangeCurrentSong,
      }),
    );

    act(() => {
      result.current.handleNext();
    });

    expect(mockChangeCurrentSong).toHaveBeenCalledWith(
      differentSong,
      differentSong.video_id,
      Number(differentSong.start),
    );
    expect(mockPlayerControls.seekTo).not.toHaveBeenCalled();
  });
});
