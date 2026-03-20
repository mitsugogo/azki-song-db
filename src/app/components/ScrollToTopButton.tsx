"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HiArrowUp } from "react-icons/hi";

/**
 * 最も近いスクロール可能な祖先要素を検出する
 */
function getScrollableAncestor(
  element: HTMLElement | null,
): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current) {
    const { overflow, overflowY } = window.getComputedStyle(current);
    if (/(auto|scroll)/.test(overflow + overflowY)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * スクロール位置が400px以上のときに表示される「トップに戻る」ボタン
 * 最も近いスクロール可能な祖先要素を自動検出し、そのコンテナのスクロールを監視する。
 * スクロール可能な祖先がない場合は window にフォールバックする。
 * scrollElement を指定すると、そのコンテナを直接監視する。
 */
export function ScrollToTopButton({
  scrollElement,
}: { scrollElement?: HTMLElement | null } = {}) {
  const [showButton, setShowButton] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const scrollContainer =
      scrollElement ?? getScrollableAncestor(buttonRef.current);
    scrollContainerRef.current = scrollContainer;

    const handleScroll = () => {
      const scrollTop = scrollContainer
        ? scrollContainer.scrollTop
        : window.scrollY;
      setShowButton(scrollTop > 400);
    };

    const target: HTMLElement | Window = scrollContainer ?? window;
    handleScroll();
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [scrollElement]);

  const handleBackToTop = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleBackToTop}
      aria-label="ページ上部へ戻る"
      className={`fixed bottom-20 right-4 z-40 inline-flex items-center justify-center rounded-full bg-primary-600 p-3 text-white shadow-lg transition-all duration-200 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 ${
        showButton
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <HiArrowUp className="h-5 w-5" />
    </button>
  );
}
