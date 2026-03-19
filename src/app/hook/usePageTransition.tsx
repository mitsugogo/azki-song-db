"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGlobalPlayer } from "./useGlobalPlayer";
import { isWatchPagePath } from "../lib/watchUrl";

/**
 * ページ遷移を検知してミニプレイヤーを表示するフック
 */
export default function usePageTransition() {
  const pathname = usePathname();
  const { currentSong, minimizePlayer } = useGlobalPlayer();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const isLeavingWatchPage =
      isWatchPagePath(previousPathname) && !isWatchPagePath(pathname);

    // watch ページから他のページに遷移した瞬間だけ自動でミニプレイヤー化
    if (isLeavingWatchPage && currentSong) {
      minimizePlayer();
    }

    previousPathnameRef.current = pathname;
  }, [pathname, currentSong, minimizePlayer]);
}
