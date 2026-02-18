"use client";

import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import useSongs from "../hook/useSongs";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useLocalStorage } from "@mantine/hooks";
import YouTubePlayer from "./YouTubePlayer";
import { applyPersistedVolumeToPlayer } from "../hook/usePlayerVolume";
import { YouTubeEvent } from "react-youtube";
import { FaTimes, FaExpand } from "react-icons/fa";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import YoutubeThumbnail from "./YoutubeThumbnail";

type Position = {
  x: number;
  y: number;
};

const SNAP_DISTANCE = 50; // スナップ距離（ピクセル）
const STORAGE_KEY = "mini-player-position";

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
    setCurrentSong,
  } = useGlobalPlayer();
  const { allSongs } = useSongs();
  const pathname = usePathname();
  const router = useRouter();
  const [playerKey, setPlayerKey] = useState(0);
  const playerRef = useRef<any>(null);
  const [hasRestoredTime, setHasRestoredTime] = useState(false);
  const [storedPosition, setStoredPosition] = useLocalStorage<Position | null>({
    key: STORAGE_KEY,
    defaultValue: null,
  });

  // 再生中の動画情報を保持（動画が変わったときだけ更新）
  const [playingSong, setPlayingSong] = useState(currentSong);
  const lastVideoIdRef = useRef<string | null>(null);
  const lastPathnameRef = useRef<string>(pathname);

  // ドラッグ機能の状態
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const positionRef = useRef<Position>(position);
  const snappedRef = useRef({
    left: false,
    right: false,
    top: false,
    bottom: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const miniPlayerRef = useRef<HTMLDivElement>(null);

  // ホームページ（メインプレイヤーがある場所）ではミニプレイヤーを非表示
  const isHomePage = pathname === "/";

  const sortedSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => parseInt(b.start) - parseInt(a.start));
  }, [allSongs]);

  // 初期位置を設定（保存された位置またはデフォルト位置）
  useEffect(() => {
    const savedPosition = storedPosition
      ? JSON.stringify(storedPosition)
      : null;
    const playerWidth = 320; // w-80 = 320px
    const playerHeight = miniPlayerRef.current?.offsetHeight || 240;

    const safeWindowWidth =
      typeof window !== "undefined" ? window.innerWidth : playerWidth + 32;
    const safeWindowHeight =
      typeof window !== "undefined" ? window.innerHeight : playerHeight + 32;

    const minX = 16;
    const minY = 16;

    const defaultPosition = {
      x: Math.max(minX, safeWindowWidth - playerWidth - 16), // 右端スナップ（余白16px）
      y: Math.max(minY, safeWindowHeight - playerHeight - 16), // 下端スナップ（余白16px）
    };

    const clamp = (p: Position) => ({
      x: Math.max(
        minX,
        Math.min(p.x, Math.max(minX, safeWindowWidth - playerWidth - 16)),
      ),
      y: Math.max(
        minY,
        Math.min(p.y, Math.max(minY, safeWindowHeight - playerHeight - 16)),
      ),
    });

    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as any;
        const px =
          parsed && typeof parsed.x !== "undefined" ? Number(parsed.x) : NaN;
        const py =
          parsed && typeof parsed.y !== "undefined" ? Number(parsed.y) : NaN;
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
          setPosition(defaultPosition);
          setStoredPosition(defaultPosition);
        } else {
          const clamped = clamp({ x: px, y: py });
          setPosition(clamped);
          setStoredPosition(clamped);
        }
      } catch {
        // デフォルト位置（右下のスナップ位置）
        setPosition(defaultPosition);
        setStoredPosition(defaultPosition);
      }
    } else {
      // デフォルト位置（右下のスナップ位置）
      setPosition(defaultPosition);
      setStoredPosition(defaultPosition);
    }
  }, []);

  // position の最新値を参照できるように ref と同期
  useEffect(() => {
    positionRef.current = position;
    const playerWidth = 320;
    const playerHeight = miniPlayerRef.current?.offsetHeight || 240;
    const minX = 16;
    const minY = 16;

    const windowWidth =
      typeof window !== "undefined"
        ? window.innerWidth
        : position.x + playerWidth + 16 + SNAP_DISTANCE;
    const windowHeight =
      typeof window !== "undefined"
        ? window.innerHeight
        : position.y + playerHeight + 16 + SNAP_DISTANCE;

    snappedRef.current.left = position.x <= minX + SNAP_DISTANCE;
    snappedRef.current.right =
      position.x >= windowWidth - playerWidth - 16 - SNAP_DISTANCE;
    snappedRef.current.top = position.y <= minY + SNAP_DISTANCE;
    snappedRef.current.bottom =
      position.y >= windowHeight - playerHeight - 16 - SNAP_DISTANCE;
  }, [position]);

  // ウィンドウリサイズ時にミニプレイヤーが画面外に出ていれば追従（クランプ）する
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const playerWidth = 320;
      const playerHeight = miniPlayerRef.current?.offsetHeight || 240;

      const minX = 16;
      const minY = 16;
      const maxX = Math.max(minX, windowWidth - playerWidth - 16);
      const maxY = Math.max(minY, windowHeight - playerHeight - 16);

      const cur = positionRef.current;

      // スナップされていた辺を保持している場合は、その辺に追従させる
      let clampedX = cur.x;
      if (snappedRef.current.left) {
        clampedX = minX;
      } else if (snappedRef.current.right) {
        clampedX = maxX;
      } else {
        clampedX = Math.min(Math.max(cur.x, minX), maxX);
      }

      let clampedY = cur.y;
      if (snappedRef.current.top) {
        clampedY = minY;
      } else if (snappedRef.current.bottom) {
        clampedY = maxY;
      } else {
        clampedY = Math.min(Math.max(cur.y, minY), maxY);
      }

      if (clampedX !== cur.x || clampedY !== cur.y) {
        setPosition({ x: clampedX, y: clampedY });
        setStoredPosition({ x: clampedX, y: clampedY });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 四隅にスナップする関数
  const snapToCorner = useCallback((x: number, y: number): Position => {
    const playerWidth = 320; // w-80 = 320px
    const playerHeight = miniPlayerRef.current?.offsetHeight || 240;
    const windowWidth =
      typeof window !== "undefined" ? window.innerWidth : x + playerWidth + 16;
    const windowHeight =
      typeof window !== "undefined"
        ? window.innerHeight
        : y + playerHeight + 16;

    let snappedX = x;
    let snappedY = y;

    // 左端にスナップ
    if (x < SNAP_DISTANCE) {
      snappedX = 16; // left-4 = 16px
    }
    // 右端にスナップ
    else if (x + playerWidth > windowWidth - SNAP_DISTANCE) {
      snappedX = windowWidth - playerWidth - 16;
    }

    // 上端にスナップ
    if (y < SNAP_DISTANCE) {
      snappedY = 16; // top-4 = 16px
    }
    // 下端にスナップ
    else if (y + playerHeight > windowHeight - SNAP_DISTANCE) {
      snappedY = windowHeight - playerHeight - 16;
    }

    return { x: snappedX, y: snappedY };
  }, []);

  // マウスダウンイベントハンドラ
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // ボタンのクリックは無視
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    if (miniPlayerRef.current) {
      const rect = miniPlayerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  // マウス移動イベントハンドラ
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 画面外に出ないように制限
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const playerWidth = 320;
      const playerHeight = miniPlayerRef.current?.offsetHeight || 240;

      const clampedX = Math.max(0, Math.min(newX, windowWidth - playerWidth));
      const clampedY = Math.max(0, Math.min(newY, windowHeight - playerHeight));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // ドラッグ終了時に四隅にスナップ
      setPosition((prev) => {
        const snapped = snapToCorner(prev.x, prev.y);
        // 位置を保存
        setStoredPosition(snapped);
        return snapped;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, snapToCorner]);

  useEffect(() => {
    // ページ遷移または動画IDが変わったときにプレイヤーをリセット
    if (!isHomePage && currentSong) {
      const videoIdChanged = currentSong.video_id !== lastVideoIdRef.current;
      const pathnameChanged = pathname !== lastPathnameRef.current;

      if (videoIdChanged || pathnameChanged) {
        setPlayerKey((prev) => prev + 1);
        setHasRestoredTime(false);
        setPlayingSong(currentSong);
        lastVideoIdRef.current = currentSong.video_id;
        lastPathnameRef.current = pathname;
      }
    }
  }, [pathname, isHomePage, currentSong?.video_id]);

  const handlePlayerOnReady = (event: YouTubeEvent<number>) => {
    playerRef.current = event.target;
    try {
      applyPersistedVolumeToPlayer(event.target);
    } catch (_) {}
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

  // 再生位置を定期的に保存と曲の更新
  useEffect(() => {
    if (!isPlaying || !currentSong) return;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // 曲の更新チェック
        const foundSong = sortedSongs.find(
          (s) =>
            s.video_id === currentSong.video_id && parseInt(s.start) <= time,
        );
        if (
          foundSong &&
          (foundSong.title !== currentSong.title ||
            foundSong.start !== currentSong.start)
        ) {
          setCurrentSong(foundSong);
        }
      }
    }, 1000); // 1秒ごとに保存

    return () => clearInterval(interval);
  }, [isPlaying, currentSong, setCurrentTime, setCurrentSong, sortedSongs]);

  const handleClose = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
    setIsMinimized(false);
  }, [setIsPlaying, setIsMinimized]);

  const handleMaximize = useCallback(() => {
    maximizePlayer();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.pathname = "/";
      const target =
        url.pathname + (url.search ? `?${url.searchParams.toString()}` : "");
      router.push(target);
    } else {
      router.push("/");
    }
  }, [maximizePlayer, router]);

  // ホームページではミニプレイヤーを表示しない
  if (isHomePage || !isMinimized || !currentSong) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={miniPlayerRef}
        data-testid="mini-player"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className="z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-2 bg-primary-500 dark:bg-primary-700 text-white select-none">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 shrink-0 relative">
              <YoutubeThumbnail
                videoId={currentSong.video_id}
                alt={currentSong.video_title}
                fill={true}
                imageClassName="w-10 h-10 rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-bold truncate"
                data-testid="mini-player-song-title"
              >
                {currentSong.title}
              </div>
              <div
                className="text-xs truncate"
                data-testid="mini-player-artist"
              >
                {currentSong.artist}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMaximize();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-primary-600 dark:hover:bg-primary-600 rounded transition-colors"
              title="プレイヤーを最大化"
            >
              <FaExpand className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-primary-600 dark:hover:bg-primary-600 rounded transition-colors"
              title="閉じる"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* プレイヤー */}
        <div className="relative aspect-video w-full bg-black">
          {playingSong && (
            <YouTubePlayer
              key={`mini-player-${playerKey}`}
              video_id={playingSong.video_id}
              startTime={Number(playingSong.start)}
              onReady={handlePlayerOnReady}
              onStateChange={handleStateChange}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
