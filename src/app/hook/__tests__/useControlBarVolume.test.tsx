import { act, renderHook } from "@testing-library/react";
import { useLocalStorage } from "@mantine/hooks";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useControlBar from "../useControlBar";

const options = {
  allSongs: [],
  currentSong: null,
  nextSong: null,
  isPlaying: false,
  changeCurrentSong: () => {},
};

const volumeEvent = (value: number) =>
  ({ target: { value: String(value) } }) as ChangeEvent<HTMLInputElement>;

function receiveVolume(value: number) {
  const oldValue = localStorage.getItem("player-volume");
  localStorage.setItem("player-volume", String(value));
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "player-volume",
      oldValue,
      newValue: String(value),
      storageArea: localStorage,
    }),
  );
}

function renderVolumeControls(ready = true, muted = false) {
  localStorage.setItem("player-volume", "25");
  const setVolume = vi.fn();
  const unMute = vi.fn();
  const hook = renderHook(() => {
    const [volume, saveVolume] = useLocalStorage<number>({
      key: "player-volume",
      defaultValue: 100,
    });
    const [isReady, setReady] = useState(ready);
    const [isMuted, setMuted] = useState(muted);
    const bar = useControlBar({
      ...options,
      playerControls: {
        isReady,
        volume,
        isMuted,
        currentTime: 0,
        duration: 0,
        play: () => {},
        pause: () => {},
        seekTo: () => {},
        mute: () => setMuted(true),
        unMute: () => {
          unMute();
          setMuted(false);
        },
        setVolume: (value) => {
          setVolume(value);
          saveVolume(value);
          setMuted(value === 0);
        },
      },
    });
    return { bar, volume, setReady };
  });
  return { ...hook, setVolume, unMute };
}

describe("useControlBar (volume synchronization)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("保存音量の復元と別タブからの同期で古い値を書き戻さない", () => {
    const { result, setVolume } = renderVolumeControls();
    expect(result.current.bar.tempVolumeValue).toBe(25);
    act(() => vi.advanceTimersByTime(100));
    expect(setVolume).not.toHaveBeenCalled();

    act(() => receiveVolume(80));
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.volume).toBe(80);
    expect(result.current.bar.tempVolumeValue).toBe(80);
    expect(localStorage.getItem("player-volume")).toBe("80");
    expect(setVolume).not.toHaveBeenCalled();
  });

  it("連続するスライダー操作の最後の値だけを100ms後に保存する", () => {
    const { result, setVolume } = renderVolumeControls();
    act(() => result.current.bar.handleVolumeChange(volumeEvent(40)));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.bar.handleVolumeChange(volumeEvent(60)));
    act(() => vi.advanceTimersByTime(99));
    expect(result.current.bar.tempVolumeValue).toBe(60);
    expect(setVolume).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(300));
    expect(setVolume).toHaveBeenCalledExactlyOnceWith(60);
    expect(localStorage.getItem("player-volume")).toBe("60");
  });

  it("待機中に別タブの音量を受信したら古い操作を取り消す", () => {
    const { result, setVolume } = renderVolumeControls();
    act(() => result.current.bar.handleVolumeChange(volumeEvent(40)));
    act(() => vi.advanceTimersByTime(50));
    act(() => receiveVolume(80));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.bar.tempVolumeValue).toBe(80);
    expect(localStorage.getItem("player-volume")).toBe("80");
    expect(setVolume).not.toHaveBeenCalled();
  });

  it("準備前の操作を保存せず、準備状態が解除されたら待機中の操作も取り消す", () => {
    const { result, setVolume } = renderVolumeControls(false);
    act(() => result.current.bar.handleVolumeChange(volumeEvent(40)));
    act(() => result.current.setReady(true));
    act(() => vi.advanceTimersByTime(100));
    expect(setVolume).not.toHaveBeenCalled();

    act(() => result.current.bar.handleVolumeChange(volumeEvent(60)));
    act(() => result.current.setReady(false));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.setReady(true));
    act(() => vi.advanceTimersByTime(100));
    expect(setVolume).not.toHaveBeenCalled();
    expect(localStorage.getItem("player-volume")).toBe("25");
  });

  it("ミュート中の音量操作で解除し、操作した値を保持して保存する", () => {
    const { result, setVolume, unMute } = renderVolumeControls(true, true);
    act(() => result.current.bar.handleVolumeChange(volumeEvent(60)));
    expect(unMute).toHaveBeenCalledOnce();
    expect(result.current.bar.tempVolumeValue).toBe(60);
    act(() => vi.advanceTimersByTime(100));
    expect(setVolume).toHaveBeenCalledExactlyOnceWith(60);
    expect(result.current.bar.isMuted).toBe(false);
  });

  it("アンマウント後に待機中の音量を書き込まない", () => {
    const { result, setVolume, unmount } = renderVolumeControls();
    act(() => result.current.bar.handleVolumeChange(volumeEvent(60)));
    unmount();
    act(() => vi.advanceTimersByTime(100));
    expect(setVolume).not.toHaveBeenCalled();
    expect(localStorage.getItem("player-volume")).toBe("25");
  });

  it("複数タブの非同期同期でも音量の書き戻しが循環しない", () => {
    const writes: { tab: number; volume: number }[] = [];
    const { result } = renderHook(() => {
      const [volumes, setVolumes] = useState([25, 25]);
      const controls = (tab: number) => ({
        isReady: true,
        volume: volumes[tab],
        isMuted: false,
        currentTime: 0,
        duration: 0,
        play: () => {},
        pause: () => {},
        seekTo: () => {},
        mute: () => {},
        unMute: () => {},
        setVolume: (volume: number) => {
          writes.push({ tab, volume });
          setVolumes((old) => old.map((v, i) => (i === tab ? volume : v)));
          // 別ドキュメントへのstorageイベントの非同期通知を模す。
          setTimeout(() => {
            setVolumes((old) => old.map((v, i) => (i !== tab ? volume : v)));
          }, 1);
        },
      });
      const first = useControlBar({ ...options, playerControls: controls(0) });
      const second = useControlBar({ ...options, playerControls: controls(1) });
      return { first, second, volumes };
    });

    act(() => result.current.second.handleVolumeChange(volumeEvent(80)));
    act(() => vi.advanceTimersByTime(100));
    for (let i = 0; i < 10; i++) {
      act(() => vi.advanceTimersByTime(100));
    }
    expect(writes).toEqual([{ tab: 1, volume: 80 }]);
    expect(result.current.volumes).toEqual([80, 80]);
    expect(result.current.first.tempVolumeValue).toBe(80);
  });
});
