"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePageNavigationViewport } from "../components/PageNavigationLayoutContext";

/** Keep anchor navigation inside the shared content viewport, including deep links. */
export default function GuideAnchors({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = usePageNavigationViewport();

  const navigate = useCallback(
    (hash: string) => {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return false;
      }
      const target = document.getElementById(id);
      const viewport = viewportRef?.current;
      if (!target || !rootRef.current?.contains(target) || !viewport)
        return false;

      const top =
        viewport.scrollTop +
        target.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top -
        16;
      viewport.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      target.focus({ preventScroll: true });
      return true;
    },
    [viewportRef],
  );

  useEffect(() => {
    const restoreHash = () => navigate(window.location.hash);
    const frame = requestAnimationFrame(restoreHash);
    window.addEventListener("hashchange", restoreHash);
    window.addEventListener("popstate", restoreHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", restoreHash);
      window.removeEventListener("popstate", restoreHash);
    };
    // The context changes once the ScrollArea viewport is mounted.
  }, [navigate]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as Element).closest("a");
    const href = anchor?.getAttribute("href");
    if (anchor?.target === "_blank" || !href?.startsWith("#")) return;
    if (!navigate(href)) return;
    event.preventDefault();
    if (window.location.hash !== href) window.history.pushState(null, "", href);
  };

  return (
    <div ref={rootRef} onClick={handleClick}>
      {children}
    </div>
  );
}
