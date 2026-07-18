"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";

export type WatchLayoutMode =
  "portrait-theater" | "landscape-columns" | "tabletop";

export type FoldableMode = "default" | "foldable";

export type ViewportSegmentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TabletopPanes = {
  top: ViewportSegmentRect;
  bottom: ViewportSegmentRect;
} | null;

export type WatchLayoutState = {
  mode: WatchLayoutMode;
  supportsDevicePosture: boolean;
  posture: "continuous" | "folded";
  orientation: "portrait" | "landscape";
  segments: ViewportSegmentRect[];
  tabletopPanes: TabletopPanes;
};

export type WatchLayoutInput = Omit<
  WatchLayoutState,
  "mode" | "tabletopPanes"
> & {
  manualFoldableMode: FoldableMode;
};

const initialWatchLayoutInput: WatchLayoutInput = {
  supportsDevicePosture: false,
  posture: "continuous",
  orientation: "landscape",
  segments: [],
  manualFoldableMode: "default",
};

const rectFromDomRect = (rect: DOMRect): ViewportSegmentRect => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
  left: rect.left,
});

const areApproximatelyEqual = (a: number, b: number) => Math.abs(a - b) <= 1;

export const resolveWatchOrientation = (
  screenOrientationType: string | undefined,
  viewportMatchesPortrait: boolean,
  viewportWidth: number,
  viewportHeight: number,
): "portrait" | "landscape" => {
  if (viewportWidth > 0 && viewportHeight > 0) {
    const aspectRatio = viewportWidth / viewportHeight;

    // Galaxy Fold の内画面はブラウザUIの伸縮で縦持ちでもわずかに横長に
    // なるため、ほぼ正方形のときだけ端末の物理方向を優先する。
    if (aspectRatio < 0.9) return "portrait";
    if (aspectRatio > 1.1) return "landscape";
  }

  if (screenOrientationType?.startsWith("portrait")) return "portrait";
  if (screenOrientationType?.startsWith("landscape")) return "landscape";
  return viewportMatchesPortrait ? "portrait" : "landscape";
};

export const getVerticallyStackedPanes = (
  segments: ViewportSegmentRect[],
): TabletopPanes => {
  if (segments.length !== 2) return null;

  const [first, second] = [...segments].sort((a, b) => a.top - b.top);
  const shareHorizontalBounds =
    areApproximatelyEqual(first.left, second.left) &&
    areApproximatelyEqual(first.width, second.width);
  const areStacked = first.bottom <= second.top + 1;

  return shareHorizontalBounds && areStacked
    ? { top: first, bottom: second }
    : null;
};

export const resolveWatchLayout = (
  input: WatchLayoutInput,
): WatchLayoutState => {
  const tabletopPanes = getVerticallyStackedPanes(input.segments);
  const isManualTabletop =
    !input.supportsDevicePosture && input.manualFoldableMode === "foldable";
  const isFolded = input.posture === "folded" || isManualTabletop;
  const hasMultipleUnrecognizedSegments =
    input.segments.length > 1 && !tabletopPanes;

  // 上下に分割された2セグメントは横向き半折りであることを直接示す。
  // Galaxyでは姿勢変更直後にorientationだけ古い値が残ることがあるため、
  // この場合はorientationよりセグメント形状を優先する。
  if (isFolded && tabletopPanes) {
    return { ...input, mode: "tabletop", tabletopPanes };
  }

  if (
    input.orientation === "landscape" &&
    isFolded &&
    !hasMultipleUnrecognizedSegments
  ) {
    return { ...input, mode: "tabletop", tabletopPanes };
  }

  return {
    ...input,
    mode:
      input.orientation === "portrait"
        ? "portrait-theater"
        : "landscape-columns",
    tabletopPanes: null,
  };
};

const readWatchLayoutInput = (
  manualFoldableMode: FoldableMode,
): WatchLayoutInput => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      supportsDevicePosture: false,
      posture: "continuous",
      orientation: "landscape",
      segments: [],
      manualFoldableMode,
    };
  }

  const supportsDevicePosture = Boolean(navigator.devicePosture);
  const orientation = resolveWatchOrientation(
    window.screen.orientation?.type,
    window.matchMedia("(orientation: portrait)").matches,
    window.visualViewport?.width ?? window.innerWidth,
    window.visualViewport?.height ?? window.innerHeight,
  );
  const segments = Array.from(window.viewport?.segments ?? [], rectFromDomRect);

  return {
    supportsDevicePosture,
    posture: navigator.devicePosture?.type ?? "continuous",
    orientation,
    segments,
    manualFoldableMode,
  };
};

export default function useWatchLayout(): WatchLayoutState {
  const [manualFoldableMode] = useLocalStorage<FoldableMode>({
    key: "foldable-mode",
    defaultValue: "default",
  });
  const [layout, setLayout] = useState<WatchLayoutState>(() =>
    resolveWatchLayout(initialWatchLayoutInput),
  );

  useEffect(() => {
    const updateLayout = () =>
      setLayout(resolveWatchLayout(readWatchLayoutInput(manualFoldableMode)));
    let animationFrame = 0;
    const retryTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const clearRetryTimeouts = () => {
      retryTimeouts.forEach(clearTimeout);
      retryTimeouts.clear();
    };
    const scheduleUpdateLayout = () => {
      updateLayout();
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateLayout);
      clearRetryTimeouts();

      // Chromiumではposture/resize通知よりviewport.segmentsの更新が遅れる
      // 場合があるため、ブラウザUIのアニメーション中も数回再取得する。
      [50, 150, 400, 1000].forEach((delay) => {
        const timeout = setTimeout(() => {
          retryTimeouts.delete(timeout);
          updateLayout();
        }, delay);
        retryTimeouts.add(timeout);
      });
    };
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    const screenOrientation = window.screen.orientation;
    const posture = navigator.devicePosture;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleUpdateLayout();
    };

    scheduleUpdateLayout();
    window.addEventListener("resize", scheduleUpdateLayout);
    window.visualViewport?.addEventListener("resize", scheduleUpdateLayout);
    portraitQuery.addEventListener("change", scheduleUpdateLayout);
    screenOrientation?.addEventListener("change", scheduleUpdateLayout);
    posture?.addEventListener("change", scheduleUpdateLayout);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearRetryTimeouts();
      window.removeEventListener("resize", scheduleUpdateLayout);
      window.visualViewport?.removeEventListener(
        "resize",
        scheduleUpdateLayout,
      );
      portraitQuery.removeEventListener("change", scheduleUpdateLayout);
      screenOrientation?.removeEventListener("change", scheduleUpdateLayout);
      posture?.removeEventListener("change", scheduleUpdateLayout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [manualFoldableMode]);

  return layout;
}
