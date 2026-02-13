"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@mantine/hooks";
import usePlayerControls from "./usePlayerControls";
import { GlobalPlayerContextType } from "./useGlobalPlayer";
import type { Song } from "../types/song";
import type { YouTubeEvent } from "react-youtube";

type UseMainPlayerControlsOptions = {
  songs: Song[];
  allSongs: Song[];
  globalPlayer: GlobalPlayerContextType;
};

/**
 * メインプレイヤーの再生制御ロジックをまとめたカスタムフック
 * - プレイヤーの準備状態管理
 * - 再生位置の復元
 * - 音量管理（ローカルストレージに保存）
 * - グローバルプレイヤーとの連携
 */
export default function useMainPlayerControls({
  songs,
  allSongs,
  globalPlayer,
}: UseMainPlayerControlsOptions) {
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  const [previousVideoId, setPreviousVideoId] = useState<string | null>(null);

  const {
    currentSong,
    previousSong,
    nextSong,
    isPlaying,
    playerKey,
    hideFutureSongs,
    videoId,
    videoTitle,
    videoData,
    videoInfo,
    startTime,
    timedLiveCallText,
    setHideFutureSongs,
    changeCurrentSong,
    playRandomSong,
    handlePlayerOnReady: originalHandlePlayerOnReady,
    handleStateChange: originalHandleStateChange,
    setPreviousAndNextSongs,
  } = usePlayerControls(songs, allSongs, globalPlayer);

  const [playerVolume, setPlayerVolume] = useLocalStorage<number>({
    key: "player-volume",
    defaultValue: 100,
  });
  const [isMuted, setIsMuted] = useLocalStorage<boolean>({
    key: "player-muted",
    defaultValue: false,
  });

  const updatePlayerSnapshot = useCallback((playerInstance: any) => {
    if (!playerInstance) return;
    if (typeof playerInstance.getDuration === "function") {
      const duration = playerInstance.getDuration();
      if (Number.isFinite(duration)) {
        setPlayerDuration(duration);
      }
    }
    if (typeof playerInstance.getCurrentTime === "function") {
      const currentTime = playerInstance.getCurrentTime();
      if (Number.isFinite(currentTime)) {
        setPlayerCurrentTime(currentTime);
      }
    }
  }, []);

  const applyPersistedVolume = useCallback(
    (playerInstance: any) => {
      if (!playerInstance || typeof playerInstance.setVolume !== "function") {
        return;
      }

      try {
        playerInstance.setVolume(playerVolume);
        if (isMuted) {
          try {
            if (typeof playerInstance.mute === "function") {
              playerInstance.mute();
            }
          } catch (_) {}
        } else {
          try {
            if (typeof playerInstance.unMute === "function") {
              playerInstance.unMute();
            }
          } catch (_) {}
        }
      } catch (_) {
        // ignore
      }
    },
    [playerVolume, isMuted],
  );

  const handlePlayerOnReady = useCallback(
    (event: YouTubeEvent<number>) => {
      originalHandlePlayerOnReady(event);
      playerRef.current = event.target;
      updatePlayerSnapshot(event.target);
      setIsPlayerReady(true);
      try {
        applyPersistedVolume(event.target);
      } catch (_) {}

      const currentVideoId = currentSong?.video_id;
      const shouldRestorePosition =
        currentVideoId === previousVideoId &&
        globalPlayer.currentTime > 0 &&
        !hasRestoredPosition;

      if (shouldRestorePosition) {
        setTimeout(() => {
          const player = event.target;
          if (player && typeof player.seekTo === "function") {
            player.seekTo(globalPlayer.currentTime, true);
            setHasRestoredPosition(true);
          }
        }, 500);
      } else if (currentVideoId !== previousVideoId) {
        setHasRestoredPosition(false);
      }
    },
    [
      originalHandlePlayerOnReady,
      updatePlayerSnapshot,
      applyPersistedVolume,
      currentSong?.video_id,
      previousVideoId,
      globalPlayer.currentTime,
      hasRestoredPosition,
    ],
  );

  const handlePlayerStateChange = useCallback(
    (event: YouTubeEvent<number>) => {
      originalHandleStateChange(event);
      updatePlayerSnapshot(event.target);
    },
    [originalHandleStateChange, updatePlayerSnapshot],
  );

  const changeVolume = useCallback(
    (volume: number) => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        const clampedVolume = Math.min(Math.max(Math.round(volume), 0), 100);
        if (typeof playerRef.current.setVolume === "function") {
          playerRef.current.setVolume(clampedVolume);
        }
        setPlayerVolume(clampedVolume);
        if (clampedVolume > 0 && isMuted) {
          try {
            if (typeof playerRef.current.unMute === "function") {
              playerRef.current.unMute();
            }
          } catch (_) {}
          setIsMuted(false);
        }
      } catch (_) {
        // ignore
      }
    },
    [isPlayerReady, isMuted, setPlayerVolume, setIsMuted],
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      try {
        if (playerRef.current) {
          if (muted) {
            if (typeof playerRef.current.mute === "function") {
              playerRef.current.mute();
            }
          } else {
            if (typeof playerRef.current.unMute === "function") {
              playerRef.current.unMute();
            }
          }
        }
      } catch (_) {}
      setIsMuted(muted);
    },
    [setIsMuted],
  );

  const playVideo = useCallback(() => {
    if (
      !playerRef.current ||
      typeof playerRef.current.playVideo !== "function"
    ) {
      return;
    }
    try {
      playerRef.current.playVideo();
    } catch (error) {
      console.error("Failed to play video:", error);
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (
      !playerRef.current ||
      typeof playerRef.current.pauseVideo !== "function"
    ) {
      return;
    }
    try {
      playerRef.current.pauseVideo();
    } catch (error) {
      console.error("Failed to pause video:", error);
    }
  }, []);

  const seekToAbsolute = useCallback(
    (absoluteSeconds: number) => {
      if (
        !playerRef.current ||
        typeof playerRef.current.seekTo !== "function"
      ) {
        return;
      }
      try {
        const boundedAbsolute =
          playerDuration > 0
            ? Math.min(Math.max(absoluteSeconds, 0), playerDuration)
            : Math.max(absoluteSeconds, 0);
        playerRef.current.seekTo(boundedAbsolute, true);
        globalPlayer.setCurrentTime(boundedAbsolute);
      } catch (error) {
        console.error("Failed to seek:", error);
      }
    },
    [playerDuration, globalPlayer],
  );

  useEffect(() => {
    globalPlayer.setSeekTo(seekToAbsolute);
    return () => {
      globalPlayer.setSeekTo(null);
    };
  }, [seekToAbsolute, globalPlayer]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    if (globalPlayer.isMinimized) return;
    try {
      applyPersistedVolume(playerRef.current);
    } catch (_) {}
  }, [isPlayerReady, globalPlayer.isMinimized, applyPersistedVolume]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || !isPlaying) return;

    let lastTime =
      typeof playerRef.current.getCurrentTime === "function"
        ? playerRef.current.getCurrentTime()
        : 0;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const currentTime = playerRef.current.getCurrentTime();
        if (Number.isFinite(currentTime)) {
          if (Math.abs(currentTime - lastTime) >= 0.25) {
            lastTime = currentTime;
            setPlayerCurrentTime(currentTime);
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const time = playerRef.current.getCurrentTime();
        globalPlayer.setCurrentTime(time);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, globalPlayer]);

  useEffect(() => {
    if (!currentSong) {
      globalPlayer.setCurrentSong(null);
      setPreviousVideoId(null);
      return;
    }

    const currentVideoId = currentSong.video_id;

    if (currentVideoId !== previousVideoId) {
      if (previousVideoId !== null) {
        globalPlayer.setCurrentTime(0);
        setHasRestoredPosition(false);
      }
      setPreviousVideoId(currentVideoId);
    }

    globalPlayer.setCurrentSong(currentSong);
  }, [currentSong, globalPlayer, previousVideoId]);

  useEffect(() => {
    if (!playerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        try {
          if (
            playerRef.current &&
            typeof playerRef.current.getCurrentTime === "function" &&
            typeof playerRef.current.seekTo === "function"
          ) {
            const currentTime = playerRef.current.getCurrentTime();
            const delta = event.key === "ArrowLeft" ? -10 : 10;
            let newTime = Math.max(0, currentTime + delta);
            if (typeof playerRef.current.getDuration === "function") {
              const dur = playerRef.current.getDuration();
              if (Number.isFinite(dur)) newTime = Math.min(newTime, dur);
            } else if (playerDuration > 0) {
              newTime = Math.min(newTime, playerDuration);
            }
            playerRef.current.seekTo(newTime, true);
            try {
              globalPlayer.setCurrentTime(newTime);
            } catch (_) {}
          }
        } catch (_) {}
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerDuration, globalPlayer]);

  useEffect(() => {
    globalPlayer.setIsPlaying(isPlaying);
  }, [isPlaying, globalPlayer]);

  const playerControls = {
    isReady: isPlayerReady && Boolean(playerRef.current),
    play: playVideo,
    pause: pauseVideo,
    seekTo: seekToAbsolute,
    setVolume: changeVolume,
    mute: () => setMuted(true),
    unMute: () => setMuted(false),
    currentTime: playerCurrentTime,
    volume: playerVolume,
    isMuted,
    duration: playerDuration,
  };

  return {
    currentSong,
    previousSong,
    nextSong,
    isPlaying,
    playerKey,
    hideFutureSongs,
    videoId,
    videoTitle,
    videoData,
    videoInfo,
    startTime,
    timedLiveCallText,
    setHideFutureSongs,
    changeCurrentSong,
    playRandomSong,
    handlePlayerOnReady,
    handlePlayerStateChange,
    setPreviousAndNextSongs,
    hasRestoredPosition,
    setHasRestoredPosition,
    previousVideoId,
    setPreviousVideoId,
    playerControls,
  } as const;
}
