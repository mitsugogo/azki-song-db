"use client";

import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import YouTubePlayer from "./YouTubePlayer";
import { YouTubeEvent } from "react-youtube";
import { FaTimes, FaExpand } from "react-icons/fa";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import YoutubeThumbnail from "./YoutubeThumbnail";

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    isMinimized,
    currentTime,
    setIsPlaying,
    setCurrentTime,
    maximizePlayer,
    setIsMinimized,
  } = useGlobalPlayer();
  const pathname = usePathname();
  const router = useRouter();
  const [playerKey, setPlayerKey] = useState(0);
  const playerRef = useRef<any>(null);
  const [hasRestoredTime, setHasRestoredTime] = useState(false);

  // ホームページ（メインプレイヤーがある場所）ではミニプレイヤーを非表示
  const isHomePage = pathname === "/";

  useEffect(() => {
    // ページ遷移時にプレイヤーをリセット
    if (!isHomePage && currentSong) {
      setPlayerKey((prev) => prev + 1);
      setHasRestoredTime(false);
    }
  }, [pathname, isHomePage, currentSong]);

  const handlePlayerOnReady = (event: YouTubeEvent<number>) => {
    playerRef.current = event.target;
    // 保存された再生位置から開始
    if (currentTime > 0 && !hasRestoredTime) {
      setTimeout(() => {
        if (event.target && typeof event.target.seekTo === "function") {
          event.target.seekTo(currentTime, true);
          setHasRestoredTime(true);
          if (isPlaying) {
            event.target.playVideo();
          }
        }
      }, 300);
    } else if (isPlaying) {
      event.target.playVideo();
    }
  };

  const handleStateChange = (event: YouTubeEvent<number>) => {
    const state = event.data;
    // YouTube PlayerState: -1=未開始, 0=終了, 1=再生中, 2=一時停止, 3=バッファリング, 5=頭出し済み
    if (state === 1) {
      setIsPlaying(true);
    } else if (state === 2 || state === 0) {
      setIsPlaying(false);
    }
  };

  // 再生位置を定期的に保存
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000); // 1秒ごとに保存

    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  const handleClose = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
    setIsMinimized(false);
  };

  const handleMaximize = () => {
    maximizePlayer();
    router.push("/");
  };

  // ホームページではミニプレイヤーを表示しない
  if (isHomePage || !isMinimized || !currentSong) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-2 bg-primary-500 dark:bg-primary-700 text-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 relative">
              <YoutubeThumbnail
                videoId={currentSong.video_id}
                alt={currentSong.video_title}
                fill={true}
                imageClassName="w-10 h-10 rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">
                {currentSong.title}
              </div>
              <div className="text-xs truncate">{currentSong.artist}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={handleMaximize}
              className="p-1.5 hover:bg-primary-600 dark:hover:bg-primary-600 rounded transition-colors"
              title="プレイヤーを最大化"
            >
              <FaExpand className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-primary-600 dark:hover:bg-primary-600 rounded transition-colors"
              title="閉じる"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* プレイヤー */}
        <div className="relative aspect-video w-full bg-black">
          <YouTubePlayer
            key={`mini-player-${playerKey}`}
            song={currentSong}
            onReady={handlePlayerOnReady}
            onStateChange={handleStateChange}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
