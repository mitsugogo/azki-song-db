"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YouTubeEvent } from "react-youtube";
import { applyPersistedVolumeToPlayer } from "./usePlayerVolume";

type PlayerRef = { current: any } | undefined;

export default function usePlayerLifecycle(options: {
  originalHandlePlayerOnReady: (event: YouTubeEvent<number>) => void;
  originalHandleStateChange: (event: YouTubeEvent<number>) => void;
  globalPlayer: any;
  currentSongInfo: any | null;
  isPlaying: boolean;
  applyPersistedVolume?: (playerInstance: any) => void;
  playerRef?: { current: any } | undefined;
}) {
  const {
    originalHandlePlayerOnReady,
    originalHandleStateChange,
    globalPlayer,
    currentSongInfo,
    isPlaying,
    applyPersistedVolume,
  } = options;

  const playerRef = options.playerRef ?? useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);

  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  const [previousVideoId, setPreviousVideoId] = useState<string | null>(null);

  const updatePlayerSnapshot = useCallback((playerInstance: any) => {
    if (!playerInstance) return;
    if (typeof playerInstance.getDuration === "function") {
      const duration = playerInstance.getDuration();
      if (Number.isFinite(duration)) {
        setPlayerDuration(duration);
      }
    }
    if (typeof playerInstance.getVolume === "function") {
      const volume = playerInstance.getVolume();
      // don't set volume here (managed elsewhere), but could expose if needed
    }
    if (typeof playerInstance.getCurrentTime === "function") {
      const currentTime = playerInstance.getCurrentTime();
      if (Number.isFinite(currentTime)) {
        setPlayerCurrentTime(currentTime);
      }
    }
  }, []);

  const handlePlayerOnReady = useCallback(
    (event: YouTubeEvent<number>) => {
      originalHandlePlayerOnReady(event);
      playerRef.current = event.target;
      updatePlayerSnapshot(event.target);
      setIsPlayerReady(true);
      try {
        applyPersistedVolumeToPlayer(event.target);
      } catch (err) {
        // ignore
      }

      // restore logic: if same video and globalPlayer has time and not restored
      const currentVideoId = currentSongInfo?.video_id;
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
      globalPlayer.currentTime,
      hasRestoredPosition,
      currentSongInfo?.video_id,
      previousVideoId,
      updatePlayerSnapshot,
      applyPersistedVolume,
    ],
  );

  const handlePlayerStateChange = useCallback(
    (event: YouTubeEvent<number>) => {
      originalHandleStateChange(event);
      updatePlayerSnapshot(event.target);
    },
    [originalHandleStateChange, updatePlayerSnapshot],
  );

  // Poll player currentTime while playing
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

  // Periodically save playback position to globalPlayer
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

  // synchronize global player currentSong and previousVideoId when currentSongInfo changes
  useEffect(() => {
    if (!currentSongInfo) {
      globalPlayer.setCurrentSong(null);
      setPreviousVideoId(null);
      return;
    }

    const currentVideoId = currentSongInfo.video_id;

    if (currentVideoId !== previousVideoId) {
      if (previousVideoId !== null) {
        globalPlayer.setCurrentTime(0);
        setHasRestoredPosition(false);
      }
      setPreviousVideoId(currentVideoId);
    }

    globalPlayer.setCurrentSong(currentSongInfo);
  }, [currentSongInfo, globalPlayer, previousVideoId]);

  return {
    playerRef,
    isPlayerReady,
    playerDuration,
    playerCurrentTime,
    handlePlayerOnReady,
    handlePlayerStateChange,
    hasRestoredPosition,
    setHasRestoredPosition,
    previousVideoId,
    setPreviousVideoId,
  } as const;
}
