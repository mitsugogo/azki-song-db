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
      `https://img.youtube.com/vi/${testVideoId}/maxresdefault.jpg`,
    );
  });

  it("エラー時に次の解像度にフォールバックする", () => {
    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    expect(result.current.imageUrl).toContain("maxresdefault.jpg");

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("sddefault.jpg");

    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("hqdefault.jpg");
  });

  it("全ての解像度を試した後も最後の解像度を保持する", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useYoutubeThumbnailFallback(testVideoId),
    );

    // 全ての解像度を順番に試す
    act(() => {
      result.current.handleError(); // sddefault
    });
    act(() => {
      result.current.handleError(); // hqdefault
    });
    act(() => {
      result.current.handleError(); // mqdefault
    });
    act(() => {
      result.current.handleError(); // default
    });

    expect(result.current.imageUrl).toContain("default.jpg");

    // さらにエラーを呼んでも変わらない
    act(() => {
      result.current.handleError();
    });

    expect(result.current.imageUrl).toContain("default.jpg");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
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

    expect(result.current.imageUrl).toContain("video1/sddefault.jpg");

    // videoIdを変更
    rerender({ videoId: "video2" });

    // 最高解像度にリセットされる
    expect(result.current.imageUrl).toBe(
      "https://img.youtube.com/vi/video2/maxresdefault.jpg",
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
});
