"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef } from "react";
import { ScrollToTopButton } from "../components/ScrollToTopButton";

export default function StreamArchivesScrollControls() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        scrollFrameRef.current = null;
      });
    }

    previousPathnameRef.current = pathname;

    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [pathname]);

  return <ScrollToTopButton scrollTarget="window" behavior="auto" />;
}
