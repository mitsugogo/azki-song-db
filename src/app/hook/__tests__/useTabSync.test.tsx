import { renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useTabSync } from "../useTabSync";
import { RefObject } from "react";

describe("useTabSync", () => {
  let mockTabsRef: RefObject<{ setActiveTab: ReturnType<typeof vi.fn> }>;
  let mockSetActiveTab: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    // 元のlocationを保存
    originalLocation = window.location;

    // window.locationをモック
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000",
    } as Location;

    mockTabsRef = {
      current: {
        setActiveTab: vi.fn(),
      },
    };
    mockSetActiveTab = vi.fn();
  });

  afterEach(() => {
    // locationを復元
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it("URLクエリパラメータがない場合は何もしない", () => {
    renderHook(() => useTabSync(mockTabsRef, mockSetActiveTab));

    expect(mockTabsRef.current?.setActiveTab).not.toHaveBeenCalled();
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });

  it("URLクエリパラメータからタブインデックスを読み取る", () => {
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000?tab=2",
    } as Location;

    renderHook(() => useTabSync(mockTabsRef, mockSetActiveTab));

    expect(mockTabsRef.current?.setActiveTab).toHaveBeenCalledWith(2);
    expect(mockSetActiveTab).toHaveBeenCalledWith(2);
  });

  it("ブラウザの戻る/進むボタンに反応する", () => {
    const { unmount } = renderHook(() =>
      useTabSync(mockTabsRef, mockSetActiveTab),
    );

    // 初期状態
    expect(mockSetActiveTab).not.toHaveBeenCalled();

    // URLを変更してpopstateイベントを発火
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000?tab=3",
    } as Location;

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(mockTabsRef.current?.setActiveTab).toHaveBeenCalledWith(3);
    expect(mockSetActiveTab).toHaveBeenCalledWith(3);

    unmount();
  });

  it("アンマウント時にイベントリスナーがクリーンアップされる", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useTabSync(mockTabsRef, mockSetActiveTab),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it("tabsRefがnullの場合もエラーが発生しない", () => {
    const nullTabsRef: RefObject<null> = { current: null };

    expect(() => {
      renderHook(() => useTabSync(nullTabsRef as any, mockSetActiveTab));
    }).not.toThrow();
  });

  it("複数のpopstateイベントに反応する", () => {
    const { unmount } = renderHook(() =>
      useTabSync(mockTabsRef, mockSetActiveTab),
    );

    // 最初のpopstate
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000?tab=1",
    } as Location;
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(mockSetActiveTab).toHaveBeenCalledWith(1);

    // 2回目のpopstate
    window.location = {
      ...originalLocation,
      href: "http://localhost:3000?tab=4",
    } as Location;
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(mockSetActiveTab).toHaveBeenCalledWith(4);
    expect(mockSetActiveTab).toHaveBeenCalledTimes(2);

    unmount();
  });
});
