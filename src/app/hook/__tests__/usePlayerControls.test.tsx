import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import usePlayerControls from "../usePlayerControls";
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
  let mockGlobalPlayer: GlobalPlayerContextType;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGlobalPlayer = createMockGlobalPlayer();
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
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.hideFutureSongs).toBe(false);
  });

  it("changeCurrentSongで曲情報と再生曲を切り替えられる", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    expect(result.current.currentSong?.video_id).toBe("vid1");
    expect(result.current.currentSong?.title).toBe("Song 1");
  });

  it("songがnullでvideoIdとstartTimeが与えられた場合、該当する曲を選ぶ", () => {
    const allSongs: Song[] = [
      { ...mockSongs[0] },
      { ...mockSongs[1], video_id: "vidX", start: "0" },
      { ...mockSongs[2], video_id: "vidX", start: "10" },
      { ...mockSongs[0], video_id: "vidX", start: "20" },
    ];

    const { result } = renderHook(() =>
      usePlayerControls(allSongs, allSongs, mockGlobalPlayer),
    );

    act(() => {
      // targetStartTime=15 なので start=10 のエントリが選ばれるはず
      result.current.changeCurrentSong(null, "vidX", 15);
    });

    expect(result.current.currentSong).toBeTruthy();
    expect(result.current.currentSong?.video_id).toBe("vidX");
    expect(parseInt(result.current.currentSong!.start)).toBeLessThanOrEqual(15);
  });

  it("nullだけ渡すと何もしない", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.changeCurrentSong(null);
    });

    expect(result.current.currentSong).toBeNull();
    expect(result.current.videoId).toBe("");
    expect(result.current.startTime).toBe(0);
  });

  it("URLのクエリがリセットされ、replacestateイベントが発生する", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[0]);
    });

    // replacestateイベントが発火される
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    const calledEvent = dispatchSpy.mock.calls.find(
      (call) => (call[0] as Event).type === "replacestate",
    );
    expect(calledEvent).toBeTruthy();

    dispatchSpy.mockRestore();
  });

  it("setPreviousAndNextSongsで前後の曲が正しく設定される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
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
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.setPreviousAndNextSongs(mockSongs[0], mockSongs);
    });

    expect(result.current.previousSong).toBeNull();
    expect(result.current.nextSong?.video_id).toBe("vid2");
  });

  it("最後の曲ではnextSongがnull", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.setPreviousAndNextSongs(mockSongs[2], mockSongs);
    });

    expect(result.current.previousSong?.video_id).toBe("vid2");
    expect(result.current.nextSong).toBeNull();
  });

  it("setHideFutureSongsでlocalStorageに保存される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
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
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    expect(result.current.hideFutureSongs).toBe(true);
  });

  it("playRandomSongでランダムに曲を再生する", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.playRandomSong(mockSongs);
    });

    expect(result.current.currentSong).toBeTruthy();
    expect(result.current.currentSong?.video_id).toBe("vid2"); // 0.5 * 3 = 1.5 -> index 1

    randomSpy.mockRestore();
  });

  it("playRandomSongで空のリストを渡すと何もしない", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
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
      usePlayerControls(
        [songWithLiveCall],
        [songWithLiveCall],
        mockGlobalPlayer,
      ),
    );

    act(() => {
      result.current.changeCurrentSong(songWithLiveCall);
    });

    expect(result.current.currentSong?.live_call).toBe(
      songWithLiveCall.live_call,
    );
    // timedLiveCallTextは初期状態ではnull
    expect(result.current.timedLiveCallText).toBeNull();
  });

  it("同一の曲を再度changeCurrentSongで設定しても無視される", () => {
    const { result } = renderHook(() =>
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
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
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
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
      usePlayerControls(mockSongs, mockSongs, mockGlobalPlayer),
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

    const { result } = renderHook(() =>
      usePlayerControls(allSongs, allSongs, mockGlobalPlayer),
    );

    act(() => {
      result.current.changeCurrentSong(null, "directVid", 100);
    });

    expect(result.current.videoId).toBe("directVid");
    expect(result.current.startTime).toBe(100);
    expect(result.current.currentSong?.video_id).toBe("directVid");
  });

  it("songsが変わって現在の曲がリストにない場合は先頭曲を再生", () => {
    const { result, rerender } = renderHook(
      ({ songs, allSongs }) =>
        usePlayerControls(songs, allSongs, mockGlobalPlayer),
      { initialProps: { songs: mockSongs, allSongs: mockSongs } },
    );

    act(() => {
      result.current.changeCurrentSong(mockSongs[1]);
    });

    expect(result.current.currentSong?.video_id).toBe("vid2");

    // songsを別のリストに変更（現在の曲が含まれない）
    const newSongs: Song[] = [mockSongs[0]];

    act(() => {
      rerender({ songs: newSongs, allSongs: mockSongs });
    });

    // 先頭の曲に自動切り替え
    expect(result.current.currentSong?.video_id).toBe("vid1");
  });

  // ===== 同一動画内での曲切り替えテスト =====

  describe("同一動画内での曲切り替え", () => {
    // 同一動画内に複数の曲があるモックデータ
    const sameVideoSongs: Song[] = [
      {
        video_id: "sameVid",
        start: "0",
        end: "",
        title: "Song A",
        artist: "Artist A",
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
        video_id: "sameVid",
        start: "100",
        end: "",
        title: "Song B",
        artist: "Artist B",
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
        video_id: "sameVid",
        start: "200",
        end: "",
        title: "Song C",
        artist: "Artist C",
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

    it("同一動画内で別の曲を選択するとseekToが呼ばれる", () => {
      const { result } = renderHook(() =>
        usePlayerControls(sameVideoSongs, sameVideoSongs, mockGlobalPlayer),
      );

      // 最初の曲を選択（異なる動画への切り替えなのでseekToは呼ばれない）
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[0]);
      });

      expect(result.current.currentSong?.title).toBe("Song A");
      expect(result.current.videoId).toBe("sameVid");
      // 初回の動画読み込みなのでseekToは呼ばれない
      expect(mockGlobalPlayer.seekTo).not.toHaveBeenCalled();

      // 同一動画内の別の曲を選択
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[1]);
      });

      // 曲情報が更新される
      expect(result.current.currentSong?.title).toBe("Song B");
      // seekToがsong.startの値で呼ばれる
      expect(mockGlobalPlayer.seekTo).toHaveBeenCalledWith(100);
    });

    it("同一動画内で曲を選択してもvideoIdは再設定されない（プレイヤーリロードなし）", () => {
      const { result } = renderHook(() =>
        usePlayerControls(sameVideoSongs, sameVideoSongs, mockGlobalPlayer),
      );

      // 最初の曲を選択
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[0]);
      });

      expect(result.current.videoId).toBe("sameVid");
      const initialVideoId = result.current.videoId;

      // 同一動画内の別の曲を選択
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[2]);
      });

      // videoIdは同じまま
      expect(result.current.videoId).toBe(initialVideoId);
      // 曲情報のみ更新
      expect(result.current.currentSong?.title).toBe("Song C");
    });

    it("skipSeek: trueの場合はseekToが呼ばれない（自動遷移用）", () => {
      const { result } = renderHook(() =>
        usePlayerControls(sameVideoSongs, sameVideoSongs, mockGlobalPlayer),
      );

      // 最初の曲を選択
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[0]);
      });

      vi.clearAllMocks();

      // skipSeek: trueで曲を変更（自動遷移をシミュレート）
      act(() => {
        result.current.changeCurrentSong(
          sameVideoSongs[1],
          undefined,
          undefined,
          { skipSeek: true },
        );
      });

      // 曲情報は更新される
      expect(result.current.currentSong?.title).toBe("Song B");
      // seekToは呼ばれない
      expect(mockGlobalPlayer.seekTo).not.toHaveBeenCalled();
    });

    it("explicitStartTimeが渡された場合はその値でシークする", () => {
      const { result } = renderHook(() =>
        usePlayerControls(sameVideoSongs, sameVideoSongs, mockGlobalPlayer),
      );

      // 最初の曲を選択
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[0]);
      });

      vi.clearAllMocks();

      // 明示的なstartTimeを渡す
      act(() => {
        result.current.changeCurrentSong(sameVideoSongs[1], "sameVid", 150);
      });

      // 渡されたexplicitStartTimeでseekToが呼ばれる
      expect(mockGlobalPlayer.seekTo).toHaveBeenCalledWith(150);
    });

    it("異なる動画への切り替え時はseekToではなくvideoIdとstartTimeがセットされる", () => {
      const differentVideoSongs: Song[] = [
        ...sameVideoSongs,
        {
          video_id: "differentVid",
          start: "50",
          end: "",
          title: "Song D",
          artist: "Artist D",
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

      const { result } = renderHook(() =>
        usePlayerControls(
          differentVideoSongs,
          differentVideoSongs,
          mockGlobalPlayer,
        ),
      );

      // 最初の曲を選択
      act(() => {
        result.current.changeCurrentSong(differentVideoSongs[0]);
      });

      vi.clearAllMocks();

      // 異なる動画の曲を選択
      act(() => {
        result.current.changeCurrentSong(differentVideoSongs[3]);
      });

      // seekToは呼ばれない（動画の再読み込みになる）
      expect(mockGlobalPlayer.seekTo).not.toHaveBeenCalled();
      // videoIdとstartTimeが新しい値にセットされる
      expect(result.current.videoId).toBe("differentVid");
      expect(result.current.startTime).toBe(50);
      expect(result.current.currentSong?.title).toBe("Song D");
    });
  });
});
