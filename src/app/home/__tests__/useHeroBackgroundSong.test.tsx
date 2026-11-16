import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "../../types/song";
import {
  HERO_LATEST_PLAYED_STORAGE_KEY,
  useHeroBackgroundSong,
} from "../useHeroBackgroundSong";

const older = {
  video_id: "older",
  broadcast_at: "2026-10-01",
  title: "Older song",
  artist: "AZKi",
  tags: ["オリ曲MV"],
} as Song;
const latest = {
  ...older,
  video_id: "latest",
  broadcast_at: "2026-11-15",
} as Song;
const songs = [older, latest];

describe("useHeroBackgroundSong", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("サーバー描画では履歴を読まず動画も選ばない", () => {
    const read = vi.spyOn(Storage.prototype, "getItem");
    function ServerHero() {
      const { backgroundSong } = useHeroBackgroundSong(songs);
      return <span>{backgroundSong?.video_id ?? "none"}</span>;
    }
    expect(renderToString(<ServerHero />)).toBe("<span>none</span>");
    expect(read).not.toHaveBeenCalled();
  });

  it("最新MVを優先し、成功した訪問中は維持して次の訪問からランダムに戻る", () => {
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result, unmount } = renderHook(() => useHeroBackgroundSong(songs));
    expect(result.current.backgroundSong).toBe(latest);
    expect(write).not.toHaveBeenCalled();

    act(() => {
      result.current.onPlaybackSuccess(latest.video_id);
      result.current.onPlaybackSuccess(latest.video_id);
    });
    expect(write).toHaveBeenCalledExactlyOnceWith(
      HERO_LATEST_PLAYED_STORAGE_KEY,
      latest.video_id,
    );
    expect(result.current.backgroundSong).toBe(latest);
    unmount();
    const next = renderHook(() => useHeroBackgroundSong(songs));
    expect(next.result.current.backgroundSong).toBe(older);
  });

  it("複数の新作があっても最新の1本だけを優先する", () => {
    localStorage.setItem(HERO_LATEST_PLAYED_STORAGE_KEY, older.video_id);
    const middle = {
      ...latest,
      video_id: "middle",
      broadcast_at: "2026-11-14",
    };
    const { result, rerender } = renderHook(
      ({ items }) => useHeroBackgroundSong(items),
      { initialProps: { items: [older, middle, latest] } },
    );
    expect(result.current.backgroundSong).toBe(latest);
    act(() => result.current.onPlaybackSuccess(latest.video_id));
    rerender({ items: [older, middle, latest] });
    expect(result.current.backgroundSong).toBe(older);

    const newer = { ...latest, video_id: "newer", broadcast_at: "2026-11-16" };
    rerender({ items: [older, middle, latest, newer] });
    expect(result.current.backgroundSong).toBe(newer);
  });

  it("失敗時は1本だけ代替MVを試し、次の訪問でも最新MVを優先する", () => {
    const third = { ...older, video_id: "third" };
    const items = [older, latest, third];
    const { result, unmount } = renderHook(() => useHeroBackgroundSong(items));
    act(() => result.current.onPlaybackFailure(latest.video_id));
    expect(result.current.backgroundSong).toBe(older);
    act(() => {
      result.current.onPlaybackSuccess(latest.video_id);
      result.current.onPlaybackSuccess(older.video_id);
      result.current.onPlaybackFailure(latest.video_id);
      result.current.onPlaybackFailure(older.video_id);
    });
    expect(result.current.backgroundSong).toBe(older);
    expect(localStorage.getItem(HERO_LATEST_PLAYED_STORAGE_KEY)).toBeNull();
    unmount();
    const next = renderHook(() => useHeroBackgroundSong(items));
    expect(next.result.current.backgroundSong).toBe(latest);
  });

  it("代替候補がなくても再生済みにせず、空データの後に届いた曲を選べる", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useHeroBackgroundSong(items),
      { initialProps: { items: [] as Song[] } },
    );
    expect(result.current.backgroundSong).toBeNull();
    rerender({ items: [latest] });
    act(() => {
      result.current.onPlaybackFailure(latest.video_id);
      result.current.onPlaybackSuccess(latest.video_id);
    });
    expect(result.current.backgroundSong).toBe(latest);
    expect(localStorage.getItem(HERO_LATEST_PLAYED_STORAGE_KEY)).toBeNull();
  });

  it("履歴が読めなくても最新MVを選べ、保存失敗でも再選択しない", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage unavailable");
      });
    const { result } = renderHook(() => useHeroBackgroundSong(songs));
    expect(result.current.backgroundSong).toBe(latest);
    act(() => {
      result.current.onPlaybackSuccess(latest.video_id);
      result.current.onPlaybackSuccess(latest.video_id);
    });
    expect(result.current.backgroundSong).toBe(latest);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("StrictModeでも選択を保ち、アンマウント後の成功通知を無視する", () => {
    const { result, unmount } = renderHook(() => useHeroBackgroundSong(songs), {
      wrapper: StrictMode,
    });
    expect(result.current.backgroundSong).toBe(latest);
    const success = result.current.onPlaybackSuccess;
    unmount();
    act(() => success(latest.video_id));
    expect(localStorage.getItem(HERO_LATEST_PLAYED_STORAGE_KEY)).toBeNull();
  });
});
