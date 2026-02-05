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
      } catch (error) {
        // ignore errors from player not being fully ready
      }
    },
    [isPlayerReady, playerRef, setPlayerVolume],
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

      try {
        playerInstance.setVolume(vol);
        setPlayerVolume(vol);
      } catch (_) {
        // ignore
      }
    },
    [playerVolume, setPlayerVolume],
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

  return { playerVolume, setPlayerVolume, changeVolume, applyPersistedVolume };
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
  } catch (_) {
    // ignore
  }
}
