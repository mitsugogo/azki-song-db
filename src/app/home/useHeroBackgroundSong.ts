"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Song } from "../types/song";
import {
  getLatestHeroBackgroundSong,
  pickHeroBackgroundSong,
} from "./homeData";

export const HERO_LATEST_PLAYED_STORAGE_KEY = "azki-home:latest-played-mv:v1";

type Selection = {
  song: Song | null;
  latestVideoId: string | undefined;
  hasRecorded: boolean;
  hasFailed: boolean;
  fallbackUsed: boolean;
};

export function useHeroBackgroundSong(songs: Song[]) {
  const [backgroundSong, setBackgroundSong] = useState<Song | null>(null);
  const selectionRef = useRef<Selection | null>(null);

  useEffect(() => {
    let lastPlayedVideoId: string | null = null;
    try {
      lastPlayedVideoId = localStorage.getItem(HERO_LATEST_PLAYED_STORAGE_KEY);
    } catch {
      // 保存領域が使えなくても最新MVの再生は試みる。
    }

    const now = Date.now();
    const latest = getLatestHeroBackgroundSong(songs, now);
    const hasRecorded = latest?.video_id === lastPlayedVideoId;
    const song =
      latest && !hasRecorded ? latest : pickHeroBackgroundSong(songs, now);
    selectionRef.current = {
      song,
      latestVideoId: latest?.video_id,
      hasRecorded,
      hasFailed: false,
      fallbackUsed: false,
    };
    setBackgroundSong(song);

    return () => {
      selectionRef.current = null;
    };
  }, [songs]);

  const onPlaybackSuccess = useCallback((videoId: string) => {
    const selection = selectionRef.current;
    if (
      !selection ||
      selection.hasFailed ||
      selection.hasRecorded ||
      selection.song?.video_id !== videoId ||
      selection.latestVideoId !== videoId
    ) {
      return;
    }

    selection.hasRecorded = true;
    try {
      localStorage.setItem(HERO_LATEST_PLAYED_STORAGE_KEY, videoId);
    } catch {
      // この訪問中は再選択せず、次の訪問では再び最新MVを優先する。
    }
  }, []);

  const onPlaybackFailure = useCallback(
    (videoId: string) => {
      const selection = selectionRef.current;
      if (
        !selection ||
        selection.hasFailed ||
        selection.song?.video_id !== videoId
      ) {
        return;
      }

      selection.hasFailed = true;
      if (selection.fallbackUsed) {
        return;
      }

      const fallback = pickHeroBackgroundSong(
        songs.filter((song) => song.video_id !== videoId),
      );
      if (!fallback) {
        return;
      }

      selectionRef.current = {
        ...selection,
        song: fallback,
        hasFailed: false,
        fallbackUsed: true,
      };
      setBackgroundSong(fallback);
    },
    [songs],
  );

  return { backgroundSong, onPlaybackSuccess, onPlaybackFailure };
}
