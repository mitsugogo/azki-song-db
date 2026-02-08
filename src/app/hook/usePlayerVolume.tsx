"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "@mantine/hooks";

type PlayerRef = { current: any } | undefined;

export default function usePlayerVolume(
  playerRef: PlayerRef,
  isPlayerReady: boolean,
) {
  const [playerVolume, setPlayerVolume] = useLocalStorage<number>({
    key: "player-volume",
    defaultValue: 100,
  });
  const [isMuted, setIsMuted] = useLocalStorage<boolean>({
    key: "player-muted",
    defaultValue: false,
  });

  const changeVolume = useCallback(
    (volume: number) => {
      if (!isPlayerReady) return;
      if (!playerRef || !playerRef.current) return;
      try {
        const clampedVolume = Math.min(Math.max(Math.round(volume), 0), 100);
        if (typeof playerRef.current.setVolume === "function") {
          playerRef.current.setVolume(clampedVolume);
        }
        setPlayerVolume(clampedVolume);
        // if volume is increased from 0, clear muted flag
        if (clampedVolume > 0 && isMuted) {
          try {
            if (typeof playerRef.current.unMute === "function") {
              playerRef.current.unMute();
            }
          } catch (_) {}
          setIsMuted(false);
        }
      } catch (error) {
        // ignore errors from player not being fully ready
      }
    },
    [isPlayerReady, playerRef, setPlayerVolume, isMuted, setIsMuted],
  );

  const applyPersistedVolume = useCallback(
    (playerInstance: any) => {
      if (!playerInstance || typeof playerInstance.setVolume !== "function")
        return;

      let vol = 100;
      try {
        const raw = localStorage.getItem("player-volume");
        if (raw !== null) {
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "number" && Number.isFinite(parsed)) {
              vol = parsed;
            } else if (!Number.isNaN(Number(raw))) {
              vol = Number(raw);
            }
          } catch (_) {
            if (!Number.isNaN(Number(raw))) vol = Number(raw);
          }
        }
      } catch (e) {
        // fallback to current stored value
        vol = Number.isFinite(Number(playerVolume))
          ? Number(playerVolume)
          : 100;
      }

      // apply muted state if persisted
      let muted = false;
      try {
        const rawMuted = localStorage.getItem("player-muted");
        if (rawMuted !== null) {
          try {
            const parsedMuted = JSON.parse(rawMuted);
            if (typeof parsedMuted === "boolean") {
              muted = parsedMuted;
            } else if (rawMuted === "true") {
              muted = true;
            }
          } catch (_) {
            if (rawMuted === "true") muted = true;
          }
        }
      } catch (_) {
        muted = Boolean(isMuted);
      }

      try {
        playerInstance.setVolume(vol);
        setPlayerVolume(vol);
        if (muted) {
          try {
            if (typeof playerInstance.mute === "function") {
              playerInstance.mute();
            }
            setIsMuted(true);
          } catch (_) {}
        } else {
          try {
            if (typeof playerInstance.unMute === "function") {
              playerInstance.unMute();
            }
            setIsMuted(false);
          } catch (_) {}
        }
      } catch (_) {
        // ignore
      }
    },
    [playerVolume, setPlayerVolume, isMuted, setIsMuted],
  );

  useEffect(() => {
    if (!isPlayerReady) return;
    if (!playerRef || !playerRef.current) return;
    try {
      applyPersistedVolume(playerRef.current);
    } catch (_) {
      // ignore
    }
  }, [isPlayerReady, playerRef, applyPersistedVolume]);

  const setMuted = useCallback(
    (muted: boolean) => {
      try {
        if (playerRef && playerRef.current) {
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
    [playerRef, setIsMuted],
  );

  return {
    playerVolume,
    setPlayerVolume,
    changeVolume,
    applyPersistedVolume,
    isMuted,
    setMuted,
  };
}

export function applyPersistedVolumeToPlayer(playerInstance: any) {
  if (!playerInstance || typeof playerInstance.setVolume !== "function") return;

  let vol = 100;
  try {
    const raw = localStorage.getItem("player-volume");
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "number" && Number.isFinite(parsed)) {
          vol = parsed;
        } else if (!Number.isNaN(Number(raw))) {
          vol = Number(raw);
        }
      } catch (_) {
        if (!Number.isNaN(Number(raw))) vol = Number(raw);
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    playerInstance.setVolume(vol);
    // apply persisted mute flag
    try {
      const rawMuted = localStorage.getItem("player-muted");
      let muted = false;
      if (rawMuted !== null) {
        try {
          const parsedMuted = JSON.parse(rawMuted);
          if (typeof parsedMuted === "boolean") muted = parsedMuted;
          else if (rawMuted === "true") muted = true;
        } catch (_) {
          if (rawMuted === "true") muted = true;
        }
      }
      if (muted && typeof playerInstance.mute === "function") {
        playerInstance.mute();
      } else if (!muted && typeof playerInstance.unMute === "function") {
        playerInstance.unMute();
      }
    } catch (_) {}
  } catch (_) {
    // ignore
  }
}
