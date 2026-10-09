"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePageNavigationViewport } from "../components/PageNavigationLayoutContext";

type PageVirtualizerOptions = Omit<
  Parameters<typeof useVirtualizer<HTMLDivElement, HTMLElement>>[0],
  "getScrollElement" | "scrollMargin"
>;

/** 共通ScrollArea内の一覧を、一覧開始位置から仮想化する。 */
export function usePageScrollVirtualizer(
  listRef: RefObject<HTMLElement | null>,
  options: PageVirtualizerOptions,
) {
  const viewportRef = usePageNavigationViewport();
  const [scrollMargin, setScrollMargin] = useState(0);

  const updateMargin = useCallback(() => {
    const list = listRef.current;
    const viewport = viewportRef?.current;
    if (!list || !viewport) return;

    const nextMargin =
      list.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop -
      viewport.clientTop;
    setScrollMargin((current) =>
      Math.abs(current - nextMargin) < 1 ? current : nextMargin,
    );
  }, [listRef, viewportRef]);

  // 条件変更で一覧より上の領域が伸縮した場合も、描画前に位置を更新する。
  useLayoutEffect(updateMargin);

  useEffect(() => {
    const viewport = viewportRef?.current;
    if (!viewport) return;
    const observer = new ResizeObserver(updateMargin);
    observer.observe(viewport);
    if (viewport.firstElementChild)
      observer.observe(viewport.firstElementChild);
    return () => observer.disconnect();
  }, [updateMargin, viewportRef]);

  return useVirtualizer({
    ...options,
    getScrollElement: () => viewportRef?.current ?? null,
    scrollMargin,
  });
}
