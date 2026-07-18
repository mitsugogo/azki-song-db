import { act, render, renderHook } from "@testing-library/react";
import { createElement, useLayoutEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getVerticallyStackedPanes,
  resolveWatchOrientation,
  resolveWatchLayout,
  default as useWatchLayout,
  type ViewportSegmentRect,
  type WatchLayoutState,
} from "../useWatchLayout";

const { manualFoldableModeRef } = vi.hoisted(() => ({
  manualFoldableModeRef: { current: "default" as "default" | "foldable" },
}));

vi.mock("@mantine/hooks", () => ({
  useLocalStorage: () => [manualFoldableModeRef.current, vi.fn()],
}));

const segment = (
  x: number,
  y: number,
  width: number,
  height: number,
): ViewportSegmentRect => ({
  x,
  y,
  width,
  height,
  left: x,
  top: y,
  right: x + width,
  bottom: y + height,
});

const baseInput = {
  supportsDevicePosture: true,
  posture: "continuous" as const,
  orientation: "landscape" as const,
  segments: [] as ViewportSegmentRect[],
  manualFoldableMode: "default" as const,
};

describe("resolveWatchLayout", () => {
  it("縦持ちをシアター相当のレイアウトにする", () => {
    expect(
      resolveWatchLayout({ ...baseInput, orientation: "portrait" }).mode,
    ).toBe("portrait-theater");
  });

  it("横持ちのcontinuousを2カラムにする", () => {
    expect(resolveWatchLayout(baseInput).mode).toBe("landscape-columns");
  });

  it("横持ちのfoldedと上下セグメントをtabletopにする", () => {
    const segments = [segment(0, 0, 700, 320), segment(0, 336, 700, 320)];
    const result = resolveWatchLayout({
      ...baseInput,
      posture: "folded",
      segments,
    });

    expect(result.mode).toBe("tabletop");
    expect(result.tabletopPanes).toEqual({
      top: segments[0],
      bottom: segments[1],
    });
    expect(result.tabletopVariant).toBe("columns");
  });

  it("上下セグメントがあれば方向APIがportraitのままでもtabletopにする", () => {
    const segments = [segment(0, 0, 700, 320), segment(0, 336, 700, 320)];
    const result = resolveWatchLayout({
      ...baseInput,
      posture: "folded",
      orientation: "portrait",
      segments,
    });

    expect(result.mode).toBe("tabletop");
    expect(result.tabletopPanes).toEqual({
      top: segments[0],
      bottom: segments[1],
    });
    expect(result.tabletopVariant).toBe("columns");
  });

  it("Flip相当の狭い上下セグメントをcompact tabletopにする", () => {
    const segments = [segment(0, 0, 412, 458), segment(0, 458, 412, 457)];
    const result = resolveWatchLayout({
      ...baseInput,
      posture: "folded",
      orientation: "portrait",
      segments,
    });

    expect(result.mode).toBe("tabletop");
    expect(result.tabletopVariant).toBe("compact");
  });

  it("foldedだがセグメント未取得なら50dvh用のtabletopにする", () => {
    const result = resolveWatchLayout({
      ...baseInput,
      posture: "folded",
    });

    expect(result.mode).toBe("tabletop");
    expect(result.tabletopPanes).toBeNull();
    expect(result.tabletopVariant).toBe("columns");
  });

  it("portraitのfoldedでセグメント未取得ならFlip用compact fallbackにする", () => {
    const result = resolveWatchLayout({
      ...baseInput,
      posture: "folded",
      orientation: "portrait",
    });

    expect(result.mode).toBe("tabletop");
    expect(result.tabletopPanes).toBeNull();
    expect(result.tabletopVariant).toBe("compact");
  });

  it("左右セグメントはtabletopにしない", () => {
    const result = resolveWatchLayout({
      ...baseInput,
      posture: "folded",
      segments: [segment(0, 0, 342, 656), segment(358, 0, 342, 656)],
    });

    expect(result.mode).toBe("landscape-columns");
    expect(result.tabletopVariant).toBeNull();
  });

  it("API非対応時だけ手動foldableをtabletopとして扱う", () => {
    expect(
      resolveWatchLayout({
        ...baseInput,
        supportsDevicePosture: false,
        manualFoldableMode: "foldable",
      }).mode,
    ).toBe("tabletop");
    expect(
      resolveWatchLayout({
        ...baseInput,
        manualFoldableMode: "foldable",
      }).mode,
    ).toBe("landscape-columns");
  });
});

describe("resolveWatchOrientation", () => {
  it("ほぼ正方形なら端末方向を優先してGalaxy内画面の縦持ちを判定する", () => {
    expect(resolveWatchOrientation("portrait-primary", false, 807, 748)).toBe(
      "portrait",
    );
  });

  it("明確に縦長なら端末方向が不整合でも通常スマホの縦持ちにする", () => {
    expect(resolveWatchOrientation("landscape-primary", false, 390, 844)).toBe(
      "portrait",
    );
  });

  it("明確に横長ならviewport寸法を優先する", () => {
    expect(resolveWatchOrientation("portrait-primary", true, 844, 390)).toBe(
      "landscape",
    );
  });

  it("APIが使えないほぼ正方形の画面ではmedia query判定へ戻す", () => {
    expect(resolveWatchOrientation(undefined, true, 800, 800)).toBe("portrait");
    expect(resolveWatchOrientation(undefined, false, 800, 800)).toBe(
      "landscape",
    );
  });
});

describe("getVerticallyStackedPanes", () => {
  it("入力順に依存せず上下のpaneを返す", () => {
    const top = segment(0, 0, 700, 320);
    const bottom = segment(0, 336, 700, 320);
    expect(getVerticallyStackedPanes([bottom, top])).toEqual({ top, bottom });
  });
});

describe("useWatchLayout", () => {
  afterEach(() => {
    manualFoldableModeRef.current = "default";
    vi.restoreAllMocks();
  });

  it("保存済みの手動foldable設定は初回描画後に反映する", () => {
    manualFoldableModeRef.current = "foldable";
    const observedLayouts: WatchLayoutState[] = [];
    const portraitQuery = new EventTarget() as MediaQueryList;
    Object.defineProperties(portraitQuery, {
      matches: { configurable: true, value: false },
      media: { configurable: true, value: "(orientation: portrait)" },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => portraitQuery),
    });

    function LayoutProbe() {
      const layout = useWatchLayout();
      useLayoutEffect(() => {
        observedLayouts.push(layout);
      }, [layout]);
      return null;
    }

    render(createElement(LayoutProbe));

    expect(observedLayouts[0]?.mode).toBe("landscape-columns");
    expect(observedLayouts.at(-1)?.mode).toBe("tabletop");
  });

  it("posture変更を再評価し、unmount時にlistenerを解除する", () => {
    let postureType: "continuous" | "folded" = "continuous";
    const posture = new EventTarget() as DevicePosture;
    Object.defineProperty(posture, "type", {
      configurable: true,
      get: () => postureType,
    });
    const removeEventListener = vi.spyOn(posture, "removeEventListener");
    const portraitQuery = new EventTarget() as MediaQueryList;
    Object.defineProperties(portraitQuery, {
      matches: { configurable: true, value: false },
      media: { configurable: true, value: "(orientation: portrait)" },
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => portraitQuery),
    });
    Object.defineProperty(navigator, "devicePosture", {
      configurable: true,
      value: posture,
    });
    Object.defineProperty(window, "viewport", {
      configurable: true,
      value: { segments: [] },
    });

    const { result, unmount } = renderHook(() => useWatchLayout());
    expect(result.current.mode).toBe("landscape-columns");

    postureType = "folded";
    act(() => posture.dispatchEvent(new Event("change")));
    expect(result.current.mode).toBe("tabletop");

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
