import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Song } from "../../types/song";
import useSongPlayCounts, {
  SONG_PLAY_COUNTS_STORAGE_KEY,
  createEmptySongPlayCountState,
  deserializeSongPlayCountState,
  getSongPlayCountKey,
  incrementSongPlayCountState,
  isSongPlayCountThresholdMet,
} from "../useSongPlayCounts";

const baseSong: Song = {
  title: "Test Song",
  artist: "Test Artist",
  album: "",
  lyricist: "",
  composer: "",
  arranger: "",
  album_list_uri: "",
  album_release_at: "",
  album_is_compilation: false,
  sing: "",
  sings: [],
  video_title: "",
  video_uri: "",
  video_id: "video-1",
  start: 0,
  end: 240,
  broadcast_at: "",
  year: 0,
  tags: [],
  milestones: [],
  hl: {
    ja: {
      title: "",
      artist: "",
      artists: [],
      album: undefined,
      sing: undefined,
      sings: undefined,
    },
    en: undefined,
  },
};

describe("useSongPlayCounts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("曲キーを title と artist から生成する", () => {
    expect(getSongPlayCountKey(baseSong)).toBe("Test Song::Test Artist");
  });

  it("70% または 180 秒で閾値達成と判定する", () => {
    expect(isSongPlayCountThresholdMet(168, 240)).toBe(true);
    expect(isSongPlayCountThresholdMet(179, 1000)).toBe(false);
    expect(isSongPlayCountThresholdMet(180, 1000)).toBe(true);
  });

  it("同じ曲名とアーティストなら別動画でも同じ集計先に加算する", () => {
    const firstState = incrementSongPlayCountState(
      createEmptySongPlayCountState(),
      baseSong,
      "2026-06-03T00:00:00.000Z",
    );
    const secondState = incrementSongPlayCountState(
      firstState,
      {
        ...baseSong,
        video_id: "video-2",
        start: 120,
      },
      "2026-06-03T01:00:00.000Z",
    );

    expect(
      secondState.records[getSongPlayCountKey(baseSong)]?.playCount,
    ).toBe(2);
  });

  it("壊れた保存値があっても空状態にフォールバックできる", () => {
    expect(deserializeSongPlayCountState("{broken-json")).toEqual(
      createEmptySongPlayCountState(),
    );
  });

  it("フック経由で再生数を永続化できる", async () => {
    const { result } = renderHook(() => useSongPlayCounts());

    act(() => {
      result.current.incrementPlayCount(
        baseSong,
        "2026-06-03T00:00:00.000Z",
      );
    });

    await waitFor(() => {
      expect(result.current.getPlayCountForSong(baseSong)).toBe(1);
    });

    await waitFor(() => {
      const persisted = deserializeSongPlayCountState(
        localStorage.getItem(SONG_PLAY_COUNTS_STORAGE_KEY),
      );
      expect(persisted.records[getSongPlayCountKey(baseSong)]?.playCount).toBe(
        1,
      );
    });
  });

  it("壊れた localStorage 値があっても上書き回復できる", async () => {
    localStorage.setItem(SONG_PLAY_COUNTS_STORAGE_KEY, "{broken-json");

    const { result } = renderHook(() => useSongPlayCounts());

    expect(result.current.getPlayCountForSong(baseSong)).toBe(0);

    act(() => {
      result.current.incrementPlayCount(
        baseSong,
        "2026-06-03T00:00:00.000Z",
      );
    });

    await waitFor(() => {
      const persisted = deserializeSongPlayCountState(
        localStorage.getItem(SONG_PLAY_COUNTS_STORAGE_KEY),
      );
      expect(persisted.records[getSongPlayCountKey(baseSong)]?.playCount).toBe(
        1,
      );
    });
  });
});