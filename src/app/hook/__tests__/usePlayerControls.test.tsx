import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import usePlayerControls from "../usePlayerControls";
import type { Song } from "../../types/song";

describe("usePlayerControls", () => {
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
    },
    {
      video_id: "vid3",
      start: "20",
      end: "",
      title: "Song 3",
      artist: "Artist 3",
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
    },
  ];

  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // window.locationを簡易モック
    originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      href: "http://localhost/",
    };
    // replaceState の実行を安全化（JSDOMの制約でエラーになるため）
    vi.spyOn(window.history, "replaceState").mockImplementation(
      () => undefined as any,
    );
  });

  afterEach(() => {
    window.location = originalLocation as any;
    // mock を戻す
    (window.history.replaceState as any).mockRestore?.();
  });

  it("初期状態が正しく設定される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.hideFutureSongs).toBe(false);
  });

  it("changeCurrentSongで曲情報と再生曲を切り替えられる", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    expect(result.current.currentSong?.video_id).toBe("vid1");
    expect(result.current.currentSongInfo?.title).toBe("Song 1");
  });

  it("infoOnlyフラグが真のときはcurrentSongは更新せずcurrentSongInfoのみ更新する", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0], true);
    });

    expect(result.current.currentSong).toBeNull();
    expect(result.current.currentSongInfo?.video_id).toBe("vid1");
  });

  it("songがnullでvideoIdとstartTimeが与えられた場合、該当する曲を選ぶ", () => {
    const allSongs: Song[] = [
      { ...mockSongs[0] },
      { ...mockSongs[1], video_id: "vidX", start: "0" },
      { ...mockSongs[2], video_id: "vidX", start: "10" },
      { ...mockSongs[0], video_id: "vidX", start: "20" },
    ];

    const { result } = renderHook(() => usePlayerControls(allSongs, allSongs));

    act(() => {
      // targetStartTime=15 なので start=10 のエントリが選ばれるはず
      result.current.changeCurrentSong(null, false, "vidX", 15);
    });

    expect(result.current.currentSongInfo).toBeTruthy();
    expect(result.current.currentSongInfo?.video_id).toBe("vidX");
    expect(parseInt(result.current.currentSongInfo!.start)).toBeLessThanOrEqual(
      15,
    );
  });

  it("nullだけ渡すと何もしない", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(null);
    });

    expect(result.current.currentSong).toBeNull();
    expect(result.current.currentSongInfo).toBeNull();
  });

  it("URLのクエリがリセットされ、replaceStateとreplacestateイベントが発生する", () => {
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    expect(replaceSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalled();

    replaceSpy.mockRestore();
    dispatchSpy.mockRestore();
  });

  it("setPreviousAndNextSongsで前後の曲が正しく設定される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[1]);
    });

    act(() => {
      result.current.setPreviousAndNextSongs(mockSongs[1], mockSongs);
    });

    expect(result.current.previousSong?.video_id).toBe("vid1");
    expect(result.current.nextSong?.video_id).toBe("vid3");
  });

  it("先頭の曲ではpreviousSongがnull", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.setPreviousAndNextSongs(mockSongs[0], mockSongs);
    });

    expect(result.current.previousSong).toBeNull();
    expect(result.current.nextSong?.video_id).toBe("vid2");
  });

  it("最後の曲ではnextSongがnull", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.setPreviousAndNextSongs(mockSongs[2], mockSongs);
    });

    expect(result.current.previousSong?.video_id).toBe("vid2");
    expect(result.current.nextSong).toBeNull();
  });

  it("setHideFutureSongsでlocalStorageに保存される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.setHideFutureSongs(true);
    });

    expect(result.current.hideFutureSongs).toBe(true);
    expect(localStorage.getItem("hideFutureSongs")).toBe("true");

    act(() => {
      result.current.setHideFutureSongs(false);
    });

    expect(result.current.hideFutureSongs).toBe(false);
    expect(localStorage.getItem("hideFutureSongs")).toBeNull();
  });

  it("localStorageからhideFutureSongsを復元できる", () => {
    localStorage.setItem("hideFutureSongs", "true");

    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    expect(result.current.hideFutureSongs).toBe(true);
  });

  it("playRandomSongでランダムに曲を再生する", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.playRandomSong(mockSongs);
    });

    expect(result.current.currentSong).toBeTruthy();
    expect(result.current.currentSongInfo?.video_id).toBe("vid2"); // 0.5 * 3 = 1.5 -> index 1

    randomSpy.mockRestore();
  });

  it("playRandomSongで空のリストを渡すと何もしない", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.playRandomSong([]);
    });

    expect(result.current.currentSong).toBeNull();
  });

  it("live_callが含まれる曲でtimedMessagesが正しくパースされる", () => {
    const songWithLiveCall: Song = {
      ...mockSongs[0],
      live_call: "0:00:10 - 0:00:15 コール1\n0:00:20 - 0:00:25 コール2",
    };

    const { result } = renderHook(() =>
      usePlayerControls([songWithLiveCall], [songWithLiveCall]),
    );

    act(() => {
      result.current.changeCurrentSong(songWithLiveCall);
    });

    expect(result.current.currentSongInfo?.live_call).toBe(
      songWithLiveCall.live_call,
    );
    // timedLiveCallTextは初期状態ではnull
    expect(result.current.timedLiveCallText).toBeNull();
  });

  it("同一の曲を再度changeCurrentSongで設定しても無視される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    const firstSong = result.current.currentSong;

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    // 同じオブジェクトのままで更新されない
    expect(result.current.currentSong).toBe(firstSong);
  });

  it("document.titleが再生状態に応じて変更される", () => {
    const { result, rerender } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    // 初期状態
    expect(document.title).toBe("AZKi Song Database");

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    // currentSongInfoはあるがisPlayingがfalseの場合
    rerender();
    expect(document.title).toBe("AZKi Song Database");
  });

  it("videoIdが変わるとvideoIdRefが更新される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    expect(result.current.currentSong?.video_id).toBe("vid1");

    act(() => {
      result.current.changeCurrentSong(mockSongs[1]);
    });

    expect(result.current.currentSong?.video_id).toBe("vid2");
  });

  it("videoIdとstartTimeを直接指定して再生できる", () => {
    const allSongs: Song[] = [
      ...mockSongs,
      { ...mockSongs[0], video_id: "directVid", start: "100" },
    ];

    const { result } = renderHook(() => usePlayerControls(allSongs, allSongs));

    act(() => {
      result.current.changeCurrentSong(null, false, "directVid", 100);
    });

    expect(result.current.videoId).toBe("directVid");
    expect(result.current.startTime).toBe(100);
    expect(result.current.currentSongInfo?.video_id).toBe("directVid");
  });

  it("songsが変わって現在の曲がリストにない場合は先頭曲を再生", () => {
    const { result, rerender } = renderHook(
      ({ songs, allSongs }) => usePlayerControls(songs, allSongs),
      { initialProps: { songs: mockSongs, allSongs: mockSongs } },
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[1]);
    });

    expect(result.current.currentSongInfo?.video_id).toBe("vid2");

    // songsを別のリストに変更（現在の曲が含まれない）
    const newSongs: Song[] = [mockSongs[0]];

    act(() => {
      rerender({ songs: newSongs, allSongs: mockSongs });
    });

    // 先頭の曲に自動切り替え
    expect(result.current.currentSongInfo?.video_id).toBe("vid1");
  });
});
