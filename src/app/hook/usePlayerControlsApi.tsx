"use client";

import { useCallback } from "react";

type PlayerRef = { current: any } | undefined;

export default function usePlayerControlsApi(playerRef: PlayerRef) {
  const play = useCallback(() => {
    if (
      playerRef &&
      playerRef.current &&
      typeof playerRef.current.playVideo === "function"
    ) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        // ignore
      }
    }
  }, [playerRef]);

  const pause = useCallback(() => {
    if (
      playerRef &&
      playerRef.current &&
      typeof playerRef.current.pauseVideo === "function"
    ) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        // ignore
      }
    }
  }, [playerRef]);

  const seekRelative = useCallback(
    (seconds: number) => {
      if (
        playerRef &&
        playerRef.current &&
        typeof playerRef.current.seekTo === "function" &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        try {
          const current = playerRef.current.getCurrentTime();
          const newTime = Math.max(0, current + seconds);
          playerRef.current.seekTo(newTime, true);
        } catch (e) {
          // ignore
        }
      }
    },
    [playerRef],
  );

  const seekAbsolute = useCallback(
    (seconds: number) => {
      if (
        playerRef &&
        playerRef.current &&
        typeof playerRef.current.seekTo === "function"
      ) {
        try {
          playerRef.current.seekTo(seconds, true);
        } catch (e) {
          // ignore
        }
      }
    },
    [playerRef],
  );

  const mute = useCallback(() => {
    if (
      playerRef &&
      playerRef.current &&
      typeof playerRef.current.mute === "function"
    ) {
      try {
        playerRef.current.mute();
      } catch (e) {}
    }
  }, [playerRef]);

  const unMute = useCallback(() => {
    if (
      playerRef &&
      playerRef.current &&
      typeof playerRef.current.unMute === "function"
    ) {
      try {
        playerRef.current.unMute();
      } catch (e) {}
    }
  }, [playerRef]);

  return { play, pause, seekRelative, seekAbsolute, mute, unMute };
}
