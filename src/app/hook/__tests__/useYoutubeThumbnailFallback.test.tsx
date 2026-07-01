import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useYoutubeThumbnailFallback from "../useYoutubeThumbnailFallback";

describe("useYoutubeThumbnailFallback", () => {
  const testVideoId = "test_video_id";

  it("初期状態で最高解像度のURLを返す", () => {
    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    expect(result.current.imageUrl).toBe(
      `https://i.ytimg.com/vi_webp/${testVideoId}/maxresdefault.webp`,
    );
  });

  it("エラー時に次の解像度にフォールバックする", () => {
    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    expect(result.current.imageUrl).toContain("maxresdefault.webp");

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("maxresdefault.webp?retry=1");

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("sddefault.webp");

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("sddefault.webp?retry=1");

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("hqdefault.webp");
  });

  it("全ての解像度を試した後は再試行を停止する", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    // 全ての解像度を順番に試す
    act(() => {
      result.current.handleError(); // maxresdefault retry
    });
    act(() => {
      result.current.handleError(); // sddefault
    });
    act(() => {
      result.current.handleError(); // sddefault retry
    });
    act(() => {
      result.current.handleError(); // hqdefault
    });
    act(() => {
      result.current.handleError(); // hqdefault retry
    });
    act(() => {
      result.current.handleError(); // mqdefault
    });
    act(() => {
      result.current.handleError(); // mqdefault retry
    });
    act(() => {
      result.current.handleError(); // default
    });

    expect(result.current.imageUrl).toContain("default.webp");

    // 最終到達後は何度呼んでもURLが変わらず、追加ログもしない
    act(() => {
      result.current.handleError();
    });
    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("default.webp");
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

    consoleWarnSpy.mockRestore();
  });

  it("videoIdが変更されたら状態がリセットされる", () => {
    const { result, rerender } = renderHook(
      ({ videoId }) => useYoutubeThumbnailFallback(videoId),
      {
        initialProps: { videoId: "video1" },
      },
    );

    // 最初のvideoIdで解像度を下げる
    act(() => {
      result.current.handleError();
    });
    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("video1/sddefault.webp");

    // videoIdを変更
    rerender({ videoId: "video2" });

    // 最高解像度にリセットされる
    expect(result.current.imageUrl).toBe(
      "https://i.ytimg.com/vi_webp/video2/maxresdefault.webp",
    );
  });

  it("handleError関数が正しく機能する", () => {
    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    const initialUrl = result.current.imageUrl;

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).not.toBe(initialUrl);
  });

  it("最初のエラーでは同じ解像度を再試行する", () => {
    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toBe(
      `https://i.ytimg.com/vi_webp/${testVideoId}/maxresdefault.webp?retry=1`,
    );
  });
});
