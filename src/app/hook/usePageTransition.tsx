"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGlobalPlayer } from "./useGlobalPlayer";

/**
 * ページ遷移を検知してミニプレイヤーを表示するフック
 */
export default function usePageTransition() {
  const pathname = usePathname();
  const { currentSong, minimizePlayer, isMinimized } = useGlobalPlayer();

  useEffect(() => {
    // ホームページから他のページに遷移した場合、
    // 動画が選択されていればミニプレイヤーを表示
    if (pathname !== "/" && currentSong && !isMinimized) {
      minimizePlayer();
    }
  }, [pathname, currentSong, isMinimized, minimizePlayer]);
}
